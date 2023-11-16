"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebridgeCrossChainProvider = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const errors_1 = require("../../../../../common/errors");
const tokens_1 = require("../../../../../common/tokens");
const native_tokens_1 = require("../../../../../common/tokens/constants/native-tokens");
const blockchain_id_1 = require("../../../../../core/blockchain/utils/blockchains-info/constants/blockchain-id");
const web3_pure_1 = require("../../../../../core/blockchain/web3-pure/web3-pure");
const injector_1 = require("../../../../../core/injector/injector");
const cross_chain_trade_type_1 = require("../../models/cross-chain-trade-type");
const cross_chain_provider_1 = require("../common/cross-chain-provider");
const evm_common_cross_chain_abi_1 = require("../common/emv-cross-chain-trade/constants/evm-common-cross-chain-abi");
const contract_abi_1 = require("./constants/contract-abi");
const contract_address_1 = require("./constants/contract-address");
const debridge_cross_chain_supported_blockchain_1 = require("./constants/debridge-cross-chain-supported-blockchain");
const gate_contract_abi_1 = require("./constants/gate-contract-abi");
const debridge_cross_chain_trade_1 = require("./debridge-cross-chain-trade");
class DebridgeCrossChainProvider extends cross_chain_provider_1.CrossChainProvider {
    constructor() {
        super(...arguments);
        this.type = cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.DEBRIDGE;
    }
    isSupportedBlockchain(blockchain) {
        return debridge_cross_chain_supported_blockchain_1.deBridgeCrossChainSupportedBlockchains.some(supportedBlockchain => supportedBlockchain === blockchain);
    }
    static async getDeBridgeGateAddress(web3Public, fromBlockchain) {
        return await web3Public.callContractMethod(contract_address_1.DE_BRIDGE_CONTRACT_ADDRESS[fromBlockchain].providerRouter, contract_abi_1.DE_BRIDGE_CONTRACT_ABI, 'deBridgeGate');
    }
    static async getCryptoFeeAmount(web3Public, fromBlockchain) {
        const deBridgeGateAddress = await DebridgeCrossChainProvider.getDeBridgeGateAddress(web3Public, fromBlockchain);
        return web3Public.callContractMethod(deBridgeGateAddress, gate_contract_abi_1.DE_BRIDGE_GATE_CONTRACT_ABI, 'globalFixedNativeFee');
    }
    async calculate(from, toToken, options) {
        const fromBlockchain = from.blockchain;
        const toBlockchain = toToken.blockchain;
        if (!this.areSupportedBlockchains(fromBlockchain, toBlockchain)) {
            return {
                trade: null,
                error: new errors_1.NotSupportedTokensError(),
                tradeType: this.type
            };
        }
        try {
            const fakeAddress = '0xe388Ed184958062a2ea29B7fD049ca21244AE02e';
            const requestParams = {
                srcChainId: blockchain_id_1.blockchainId[fromBlockchain],
                srcChainTokenIn: from.address,
                srcChainTokenInAmount: from.stringWeiAmount,
                dstChainId: blockchain_id_1.blockchainId[toBlockchain],
                dstChainTokenOut: toToken.address,
                dstChainTokenOutRecipient: this.getWalletAddress(fromBlockchain) || fakeAddress,
                prependOperatingExpenses: false,
                affiliateFeePercent: 0.1,
                affiliateFeeRecipient: '0x0D582aC954E954419F3c2F27fD54323Ca488258A'
            };
            const { tx, estimation } = await injector_1.Injector.httpClient.get(`${DebridgeCrossChainProvider.apiEndpoint}/order/quote`, {
                params: requestParams
            });
            const to = new tokens_1.PriceTokenAmount({
                ...toToken.asStruct,
                tokenAmount: web3_pure_1.Web3Pure.fromWei(estimation.dstChainTokenOut.amount, estimation.dstChainTokenOut.decimals)
            });
            const gasData = options.gasCalculation === 'enabled'
                ? await debridge_cross_chain_trade_1.DebridgeCrossChainTrade.getGasData(from, to, requestParams)
                : null;
            const transitToken = estimation.srcChainTokenOut || estimation.srcChainTokenIn;
            const web3Public = injector_1.Injector.web3PublicService.getWeb3Public(fromBlockchain);
            const cryptoFeeAmount = await DebridgeCrossChainProvider.getCryptoFeeAmount(web3Public, fromBlockchain);
            const nativeToken = native_tokens_1.nativeTokensList[fromBlockchain];
            const cryptoFeeToken = await tokens_1.PriceTokenAmount.createFromToken({
                ...nativeToken,
                weiAmount: new bignumber_js_1.default(cryptoFeeAmount)
            });
            return {
                trade: new debridge_cross_chain_trade_1.DebridgeCrossChainTrade({
                    from,
                    to,
                    transactionRequest: requestParams,
                    gasData,
                    priceImpact: from.calculatePriceImpactPercent(to),
                    allowanceTarget: tx.allowanceTarget,
                    slippage: 0,
                    feeInfo: {
                        provider: {
                            cryptoFee: {
                                amount: web3_pure_1.Web3Pure.fromWei(new bignumber_js_1.default(cryptoFeeAmount)),
                                tokenSymbol: native_tokens_1.nativeTokensList[fromBlockchain].symbol
                            }
                        }
                    },
                    transitAmount: web3_pure_1.Web3Pure.fromWei(transitToken.amount, transitToken.decimals),
                    cryptoFeeToken,
                    onChainTrade: null
                }, options.providerAddress),
                tradeType: this.type
            };
        }
        catch (err) {
            const rubicSdkError = cross_chain_provider_1.CrossChainProvider.parseError(err);
            const debridgeApiError = this.parseDebridgeApiError(err);
            return {
                trade: null,
                error: debridgeApiError || rubicSdkError,
                tradeType: this.type
            };
        }
    }
    async getFeeInfo(fromBlockchain, providerAddress) {
        return {
            rubicProxy: {
                fixedFee: {
                    amount: await this.getFixedFee(fromBlockchain, providerAddress, contract_address_1.DE_BRIDGE_CONTRACT_ADDRESS[fromBlockchain].rubicRouter, evm_common_cross_chain_abi_1.evmCommonCrossChainAbi),
                    tokenSymbol: native_tokens_1.nativeTokensList[fromBlockchain].symbol
                },
                platformFee: {
                    percent: await this.getFeePercent(fromBlockchain, providerAddress, contract_address_1.DE_BRIDGE_CONTRACT_ADDRESS[fromBlockchain].rubicRouter, evm_common_cross_chain_abi_1.evmCommonCrossChainAbi),
                    tokenSymbol: 'USDC'
                }
            }
        };
    }
    parseDebridgeApiError(httpErrorResponse) {
        if (httpErrorResponse?.error?.errorId === 'INCLUDED_GAS_FEE_NOT_COVERED_BY_INPUT_AMOUNT' ||
            httpErrorResponse?.error?.errorId === 'ERROR_LOW_GIVE_AMOUNT') {
            return new errors_1.TooLowAmountError();
        }
        // @TODO handle other debridge API error codes:
        // CONNECTOR_1INCH_RETURNED_ERROR
        // INCLUDED_GAS_FEE_CANNOT_BE_ESTIMATED_FOR_TRANSACTION_BUNDLE
        return null;
    }
}
exports.DebridgeCrossChainProvider = DebridgeCrossChainProvider;
DebridgeCrossChainProvider.apiEndpoint = 'https://api.dln.trade/v1.0/dln';
//# sourceMappingURL=debridge-cross-chain-provider.js.map