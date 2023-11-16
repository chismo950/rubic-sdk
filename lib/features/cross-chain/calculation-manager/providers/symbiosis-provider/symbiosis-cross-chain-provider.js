"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbiosisCrossChainProvider = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const errors_1 = require("../../../../../common/errors");
const tokens_1 = require("../../../../../common/tokens");
const blockchain_name_1 = require("../../../../../core/blockchain/models/blockchain-name");
const blockchain_id_1 = require("../../../../../core/blockchain/utils/blockchains-info/constants/blockchain-id");
const web3_pure_1 = require("../../../../../core/blockchain/web3-pure/web3-pure");
const injector_1 = require("../../../../../core/injector/injector");
const get_from_without_fee_1 = require("../../../../common/utils/get-from-without-fee");
const cross_chain_trade_type_1 = require("../../models/cross-chain-trade-type");
const cross_chain_provider_1 = require("../common/cross-chain-provider");
const proxy_cross_chain_evm_trade_1 = require("../common/proxy-cross-chain-evm-facade/proxy-cross-chain-evm-trade");
const symbiosis_cross_chain_supported_blockchain_1 = require("./constants/symbiosis-cross-chain-supported-blockchain");
const symbiosis_error_1 = require("./models/symbiosis-error");
const symbiosis_cross_chain_trade_1 = require("./symbiosis-cross-chain-trade");
const constants_1 = require("../../../../on-chain/calculation-manager/providers/dexes/common/oneinch-abstract/constants");
class SymbiosisCrossChainProvider extends cross_chain_provider_1.CrossChainProvider {
    constructor() {
        super(...arguments);
        this.type = cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.SYMBIOSIS;
        this.symbiosisApi = 'https://api-v2.symbiosis.finance/crosschain/v1';
    }
    isSupportedBlockchain(blockchain) {
        return symbiosis_cross_chain_supported_blockchain_1.symbiosisCrossChainSupportedBlockchains.some(supportedBlockchain => supportedBlockchain === blockchain);
    }
    areSupportedBlockchains(fromBlockchain, toBlockchain) {
        if (fromBlockchain === blockchain_name_1.BLOCKCHAIN_NAME.BITCOIN) {
            return false;
        }
        return super.areSupportedBlockchains(fromBlockchain, toBlockchain);
    }
    async calculate(from, toToken, options) {
        const fromBlockchain = from.blockchain;
        const toBlockchain = toToken.blockchain;
        const useProxy = options?.useProxy?.[this.type] ?? true;
        // @TODO remove Tron check
        if (!this.areSupportedBlockchains(fromBlockchain, toBlockchain) ||
            fromBlockchain === blockchain_name_1.BLOCKCHAIN_NAME.TRON) {
            return {
                trade: null,
                error: new errors_1.NotSupportedTokensError(),
                tradeType: this.type
            };
        }
        try {
            const fromAddress = options.fromAddress ||
                this.getWalletAddress(fromBlockchain) ||
                constants_1.oneinchApiParams.nativeAddress;
            const feeInfo = await this.getFeeInfo(fromBlockchain, options.providerAddress, from, useProxy);
            const fromWithoutFee = (0, get_from_without_fee_1.getFromWithoutFee)(from, feeInfo.rubicProxy?.platformFee?.percent);
            const tokenIn = {
                chainId: blockchain_id_1.blockchainId[fromBlockchain],
                address: from.isNative ? '' : from.address,
                decimals: from.decimals,
                isNative: from.isNative,
                symbol: from.symbol
            };
            const tokenOut = {
                chainId: toBlockchain !== blockchain_name_1.BLOCKCHAIN_NAME.TRON ? blockchain_id_1.blockchainId[toBlockchain] : 728126428,
                address: toToken.isNative ? '' : toToken.address,
                decimals: toToken.decimals,
                isNative: toToken.isNative,
                symbol: toToken.symbol
            };
            const tokenAmountIn = {
                ...tokenIn,
                amount: fromWithoutFee.stringWeiAmount
            };
            const receiverAddress = options.receiverAddress || fromAddress;
            const deadline = Math.floor(Date.now() / 1000) + 60 * options.deadline;
            const slippageTolerance = options.slippageTolerance * 10000;
            const trade = await this.getTrade({
                tokenAmountIn,
                tokenOut,
                fromAddress,
                receiverAddress,
                refundAddress: fromAddress,
                slippage: slippageTolerance,
                deadline
            });
            const { tokenAmountOut, fee: transitTokenFee, inTradeType, outTradeType, tx, approveTo, amountInUsd } = trade;
            const swapFunction = (fromUserAddress, receiver) => {
                const refundAddress = receiver || fromAddress;
                const receiverAddress = receiver || fromUserAddress;
                const amountIn = fromWithoutFee.tokenAmount;
                const tokenAmountIn = {
                    ...tokenIn,
                    amount: web3_pure_1.Web3Pure.toWei(amountIn, from.decimals)
                };
                return this.getTrade({
                    tokenAmountIn,
                    tokenOut,
                    fromAddress: fromUserAddress,
                    receiverAddress,
                    refundAddress,
                    slippage: slippageTolerance,
                    deadline
                });
            };
            const to = new tokens_1.PriceTokenAmount({
                ...toToken.asStruct,
                tokenAmount: new bignumber_js_1.default(web3_pure_1.Web3Pure.fromWei(tokenAmountOut.amount, tokenAmountOut.decimals))
            });
            const gasData = options.gasCalculation === 'enabled'
                ? await symbiosis_cross_chain_trade_1.SymbiosisCrossChainTrade.getGasData(from, to)
                : null;
            return {
                trade: new symbiosis_cross_chain_trade_1.SymbiosisCrossChainTrade({
                    from,
                    to,
                    swapFunction,
                    gasData,
                    priceImpact: from.calculatePriceImpactPercent(to),
                    slippage: options.slippageTolerance,
                    feeInfo: {
                        ...feeInfo,
                        provider: {
                            cryptoFee: {
                                amount: new bignumber_js_1.default(web3_pure_1.Web3Pure.fromWei(transitTokenFee.amount, transitTokenFee.decimals)),
                                tokenSymbol: transitTokenFee.symbol || ''
                            }
                        }
                    },
                    transitAmount: from.tokenAmount,
                    amountInUsd: amountInUsd
                        ? web3_pure_1.Web3Pure.fromWei(amountInUsd?.amount, amountInUsd?.decimals)
                        : null,
                    tradeType: { in: inTradeType, out: outTradeType },
                    contractAddresses: {
                        providerRouter: tx.to,
                        providerGateway: approveTo
                    }
                }, options.providerAddress),
                tradeType: this.type
            };
        }
        catch (err) {
            let rubicSdkError = cross_chain_provider_1.CrossChainProvider.parseError(err);
            const symbiosisMessage = err?.error?.message;
            if (symbiosisMessage?.includes('$') || symbiosisMessage?.includes('Min amount')) {
                const symbiosisError = err.error;
                rubicSdkError =
                    symbiosisError.code === symbiosis_error_1.errorCode.AMOUNT_LESS_THAN_FEE ||
                        symbiosisError.code === 400
                        ? new errors_1.TooLowAmountError()
                        : await this.checkMinMaxErrors(symbiosisError);
            }
            else if (symbiosisMessage) {
                rubicSdkError = new errors_1.RubicSdkError(symbiosisMessage);
            }
            return {
                trade: null,
                error: rubicSdkError,
                tradeType: this.type
            };
        }
    }
    async checkMinMaxErrors(err) {
        if (err.code === symbiosis_error_1.errorCode.AMOUNT_TOO_LOW) {
            const index = err.message.lastIndexOf('$');
            const transitTokenAmount = new bignumber_js_1.default(err.message.substring(index + 1));
            return new errors_1.MinAmountError(transitTokenAmount, 'USDC');
        }
        if (err?.code === symbiosis_error_1.errorCode.AMOUNT_TOO_HIGH) {
            const index = err.message.lastIndexOf('$');
            const transitTokenAmount = new bignumber_js_1.default(err.message.substring(index + 1));
            return new errors_1.MaxAmountError(transitTokenAmount, 'USDC');
        }
        return new errors_1.RubicSdkError(err.message);
    }
    async getFeeInfo(fromBlockchain, providerAddress, percentFeeToken, useProxy) {
        return proxy_cross_chain_evm_trade_1.ProxyCrossChainEvmTrade.getFeeInfo(fromBlockchain, providerAddress, percentFeeToken, useProxy);
    }
    async getTrade(swapParams) {
        const swappingParams = {
            tokenAmountIn: swapParams.tokenAmountIn,
            tokenOut: swapParams.tokenOut,
            to: swapParams.receiverAddress || swapParams.fromAddress,
            from: swapParams.fromAddress,
            revertableAddress: swapParams.fromAddress,
            slippage: swapParams.slippage,
            deadline: swapParams.deadline
        };
        return await injector_1.Injector.httpClient.post(`${this.symbiosisApi}/swapping/exact_in?partnerId=rubic`, swappingParams);
    }
    getTransferToken(route, from) {
        const fromBlockchainId = blockchain_id_1.blockchainId[from.blockchain];
        const fromRouting = route.filter(token => token.chainId === fromBlockchainId);
        const token = fromRouting.at(-1);
        return fromRouting.length !== 1
            ? {
                address: token.address,
                decimals: token.decimals,
                name: token.name,
                blockchain: from.blockchain,
                symbol: token.symbol
            }
            : undefined;
    }
}
exports.SymbiosisCrossChainProvider = SymbiosisCrossChainProvider;
//# sourceMappingURL=symbiosis-cross-chain-provider.js.map