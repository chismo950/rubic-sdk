"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultichainCrossChainProvider = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const errors_1 = require("../../../../../common/errors");
const tokens_1 = require("../../../../../common/tokens");
const blockchain_1 = require("../../../../../common/utils/blockchain");
const blockchain_name_1 = require("../../../../../core/blockchain/models/blockchain-name");
const blockchain_id_1 = require("../../../../../core/blockchain/utils/blockchains-info/constants/blockchain-id");
const injector_1 = require("../../../../../core/injector/injector");
const get_from_without_fee_1 = require("../../../../common/utils/get-from-without-fee");
const cross_chain_trade_type_1 = require("../../models/cross-chain-trade-type");
const cross_chain_provider_1 = require("../common/cross-chain-provider");
const proxy_cross_chain_evm_trade_1 = require("../common/proxy-cross-chain-evm-facade/proxy-cross-chain-evm-trade");
const multichain_method_name_1 = require("./models/multichain-method-name");
const supported_blockchain_1 = require("./models/supported-blockchain");
const multichain_cross_chain_trade_1 = require("./multichain-cross-chain-trade");
class MultichainCrossChainProvider extends cross_chain_provider_1.CrossChainProvider {
    constructor() {
        super(...arguments);
        this.type = cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.MULTICHAIN;
    }
    isSupportedBlockchain(blockchain) {
        return supported_blockchain_1.multichainCrossChainSupportedBlockchains.some(supportedBlockchain => supportedBlockchain === blockchain);
    }
    async calculate(from, toToken, options) {
        const fromBlockchain = from.blockchain;
        const toBlockchain = toToken.blockchain;
        let useProxy = options?.useProxy?.[this.type] ?? true;
        if (fromBlockchain === blockchain_name_1.BLOCKCHAIN_NAME.ZK_SYNC) {
            useProxy = false;
        }
        if (!this.areSupportedBlockchains(fromBlockchain, toBlockchain)) {
            return {
                trade: null,
                error: new errors_1.NotSupportedTokensError(),
                tradeType: this.type
            };
        }
        try {
            const tokensInfo = await this.getTokensData(from, toToken);
            const isPureBridge = this.checkIsBridge(tokensInfo, from, toToken);
            const routerMethodName = tokensInfo.target.routerABI.split('(')[0];
            const feeInfo = await this.getFeeInfo(fromBlockchain, options.providerAddress, from, useProxy);
            const fromWithoutFee = (0, get_from_without_fee_1.getFromWithoutFee)(from, feeInfo.rubicProxy?.platformFee?.percent);
            const targetToken = tokensInfo.target;
            let onChainTrade = null;
            let transitTokenAmount = fromWithoutFee.tokenAmount;
            let transitMinAmount = transitTokenAmount;
            if (isPureBridge && !this.isMultichainMethodName(routerMethodName)) {
                return {
                    trade: null,
                    error: new errors_1.NotSupportedTokensError(),
                    tradeType: this.type
                };
            }
            if (!isPureBridge) {
                const similarAddress = (0, blockchain_1.compareAddresses)(from.address, tokensInfo.source.address);
                const isFromNative = from.isNative && tokensInfo.source.tokenType === 'NATIVE';
                const isFromWrap = (0, blockchain_1.compareAddresses)(from.address, tokens_1.wrappedNativeTokensList[from.blockchain].address);
                const shouldSwap = !((isFromNative || similarAddress) && !isFromWrap);
                if (shouldSwap) {
                    if (!useProxy) {
                        return {
                            trade: null,
                            error: new errors_1.NotSupportedTokensError(),
                            tradeType: this.type
                        };
                    }
                    const transitToken = tokensInfo.source.tokenType === 'NATIVE'
                        ? tokens_1.nativeTokensList[fromBlockchain]
                        : {
                            address: tokensInfo.source.address,
                            blockchain: fromBlockchain
                        };
                    onChainTrade = await proxy_cross_chain_evm_trade_1.ProxyCrossChainEvmTrade.getOnChainTrade(fromWithoutFee, transitToken, options.slippageTolerance);
                    if (!onChainTrade) {
                        return {
                            trade: null,
                            error: new errors_1.NotSupportedTokensError(),
                            tradeType: this.type
                        };
                    }
                    transitTokenAmount = onChainTrade.to.tokenAmount;
                    transitMinAmount = onChainTrade.toTokenAmountMin.tokenAmount;
                }
            }
            const feeToAmount = this.getToFeeAmount(transitTokenAmount, targetToken);
            const toAmount = transitTokenAmount.minus(feeToAmount);
            const to = new tokens_1.PriceTokenAmount({
                ...toToken.asStruct,
                tokenAmount: toAmount
            });
            const toTokenAmountMin = transitMinAmount.minus(feeToAmount);
            const routerAddress = targetToken.router;
            const spenderAddress = targetToken.spender;
            const anyTokenAddress = targetToken.fromanytoken.address;
            const gasData = options.gasCalculation === 'enabled'
                ? await multichain_cross_chain_trade_1.MultichainCrossChainTrade.getGasData(from, to, routerAddress, spenderAddress, routerMethodName, anyTokenAddress, onChainTrade)
                : null;
            const cryptoFee = this.getProtocolFee(targetToken, from.tokenAmount);
            const trade = new multichain_cross_chain_trade_1.MultichainCrossChainTrade({
                from,
                to,
                gasData,
                priceImpact: (onChainTrade?.from && from.calculatePriceImpactPercent(to)) || null,
                toTokenAmountMin,
                feeInfo: {
                    ...feeInfo,
                    provider: {
                        cryptoFee
                    }
                },
                routerAddress,
                spenderAddress,
                routerMethodName,
                anyTokenAddress,
                onChainTrade,
                slippage: options.slippageTolerance
            }, options.providerAddress);
            try {
                const transitSymbol = onChainTrade ? onChainTrade.to.symbol : from.symbol;
                this.checkMinMaxErrors({ tokenAmount: transitTokenAmount, symbol: transitSymbol }, { tokenAmount: transitMinAmount, symbol: transitSymbol }, targetToken, feeInfo);
            }
            catch (error) {
                return {
                    trade,
                    error,
                    tradeType: this.type
                };
            }
            return { trade, tradeType: this.type };
        }
        catch (err) {
            return {
                trade: null,
                error: cross_chain_provider_1.CrossChainProvider.parseError(err),
                tradeType: this.type
            };
        }
    }
    getProtocolFee(targetToken, fromAmount) {
        const minFee = targetToken.MinimumSwapFee;
        const maxFee = targetToken.MaximumSwapFee;
        let amount = fromAmount.multipliedBy(targetToken.SwapFeeRatePerMillion).dividedBy(100);
        if (amount.gte(maxFee)) {
            amount = new bignumber_js_1.default(maxFee);
        }
        if (amount.lte(minFee)) {
            amount = new bignumber_js_1.default(minFee);
        }
        return {
            amount,
            tokenSymbol: targetToken.symbol
        };
    }
    async getFeeInfo(fromBlockchain, providerAddress, percentFeeToken, useProxy) {
        return proxy_cross_chain_evm_trade_1.ProxyCrossChainEvmTrade.getFeeInfo(fromBlockchain, providerAddress, percentFeeToken, useProxy);
    }
    checkMinMaxErrors(amount, minAmount, targetToken, feeInfo) {
        if (minAmount.tokenAmount.lt(targetToken.MinimumSwap)) {
            const minimumAmount = new bignumber_js_1.default(targetToken.MinimumSwap)
                .dividedBy(1 - (feeInfo.rubicProxy?.platformFee?.percent || 0) / 100)
                .toFixed(5, 0);
            throw new errors_1.MinAmountError(new bignumber_js_1.default(minimumAmount), minAmount.symbol);
        }
        if (amount.tokenAmount.gt(targetToken.MaximumSwap)) {
            const maximumAmount = new bignumber_js_1.default(targetToken.MaximumSwap)
                .dividedBy(1 - (feeInfo.rubicProxy?.platformFee?.percent || 0) / 100)
                .toFixed(5, 1);
            throw new errors_1.MaxAmountError(new bignumber_js_1.default(maximumAmount), amount.symbol);
        }
    }
    getToFeeAmount(fromAmount, targetToken) {
        return bignumber_js_1.default.min(bignumber_js_1.default.max(fromAmount.multipliedBy(targetToken.SwapFeeRatePerMillion / 100), new bignumber_js_1.default(targetToken.MinimumSwapFee)), new bignumber_js_1.default(targetToken.MaximumSwapFee));
    }
    isMultichainMethodName(methodName) {
        return multichain_method_name_1.multichainMethodNames.some(multichainMethodName => multichainMethodName === methodName);
    }
    async getTokensData(from, toToken) {
        const fromChainId = blockchain_id_1.blockchainId[from.blockchain];
        const toChainId = blockchain_id_1.blockchainId[toToken.blockchain];
        const tokensList = await injector_1.Injector.httpClient.get(`https://bridgeapi.anyswap.exchange/v4/tokenlistv4/${fromChainId}`);
        let possibleTargetToken = null;
        const sourceToken = Object.values(tokensList).find(sourceToken => {
            const possibleTargetTokens = Object.values(sourceToken.destChains?.[toChainId] || {});
            const possibleTargetTokenInner = possibleTargetTokens.find(targetToken => {
                const isNative = targetToken.tokenType === 'NATIVE';
                return (((0, blockchain_1.compareAddresses)(targetToken.address, toToken.address) && !isNative) ||
                    (isNative && toToken.isNative));
            });
            possibleTargetToken = possibleTargetTokenInner;
            return possibleTargetTokenInner;
        });
        if (!sourceToken || !possibleTargetToken) {
            throw new errors_1.NotSupportedTokensError();
        }
        return { source: sourceToken, target: possibleTargetToken };
    }
    checkIsBridge(tokensInfo, from, toToken) {
        const fromNative = tokensInfo.source.tokenType === 'NATIVE';
        const toNative = tokensInfo.target.tokenType === 'NATIVE';
        const fromTokenMatch = ((0, blockchain_1.compareAddresses)(tokensInfo.source.address, from.address) && !fromNative) ||
            (fromNative && from.isNative);
        const toTokenMatch = ((0, blockchain_1.compareAddresses)(tokensInfo.target.address, toToken.address) && !toNative) ||
            (toNative && toToken.isNative);
        return fromTokenMatch && toTokenMatch;
    }
}
exports.MultichainCrossChainProvider = MultichainCrossChainProvider;
//# sourceMappingURL=multichain-cross-chain-provider.js.map