"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebridgeCrossChainTrade = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const errors_1 = require("../../../../../common/errors");
const updated_rates_error_1 = require("../../../../../common/errors/cross-chain/updated-rates-error");
const tokens_1 = require("../../../../../common/tokens");
const errors_2 = require("../../../../../common/utils/errors");
const blockchain_id_1 = require("../../../../../core/blockchain/utils/blockchains-info/constants/blockchain-id");
const evm_web3_pure_1 = require("../../../../../core/blockchain/web3-pure/typed-web3-pure/evm-web3-pure/evm-web3-pure");
const web3_pure_1 = require("../../../../../core/blockchain/web3-pure/web3-pure");
const injector_1 = require("../../../../../core/injector/injector");
const cross_chain_trade_type_1 = require("../../models/cross-chain-trade-type");
const evm_common_cross_chain_abi_1 = require("../common/emv-cross-chain-trade/constants/evm-common-cross-chain-abi");
const evm_cross_chain_trade_1 = require("../common/emv-cross-chain-trade/evm-cross-chain-trade");
const bridge_type_1 = require("../common/models/bridge-type");
const portal_address_1 = require("./constants/portal-address");
const debridge_cross_chain_provider_1 = require("./debridge-cross-chain-provider");
const mete_router_abi_1 = require("../symbiosis-provider/constants/mete-router-abi");
const decode_method_1 = require("../../utils/decode-method");
const on_chain_trade_type_1 = require("../../../../on-chain/calculation-manager/providers/common/models/on-chain-trade-type");
const constants_1 = require("../../../../on-chain/calculation-manager/providers/dexes/common/oneinch-abstract/constants");
const convert_gas_price_1 = require("../../utils/convert-gas-price");
/**
 * Calculated DeBridge cross-chain trade.
 */
class DebridgeCrossChainTrade extends evm_cross_chain_trade_1.EvmCrossChainTrade {
    /** @internal */
    static async getGasData(from, to, transactionRequest) {
        const fromBlockchain = from.blockchain;
        const walletAddress = injector_1.Injector.web3PrivateService.getWeb3PrivateByBlockchain(fromBlockchain).address;
        if (!walletAddress) {
            return null;
        }
        try {
            const { contractAddress, contractAbi, methodName, methodArguments, value } = await new DebridgeCrossChainTrade({
                from,
                to,
                transactionRequest,
                gasData: null,
                priceImpact: 0,
                allowanceTarget: '',
                slippage: 0,
                feeInfo: {},
                transitAmount: new bignumber_js_1.default(NaN),
                cryptoFeeToken: from,
                onChainTrade: null
            }, evm_web3_pure_1.EvmWeb3Pure.EMPTY_ADDRESS).getContractParams({});
            const web3Public = injector_1.Injector.web3PublicService.getWeb3Public(fromBlockchain);
            const [gasLimit, gasDetails] = await Promise.all([
                web3Public.getEstimatedGas(contractAbi, contractAddress, methodName, methodArguments, walletAddress, value),
                (0, convert_gas_price_1.convertGasDataToBN)(await injector_1.Injector.gasPriceApi.getGasPrice(from.blockchain))
            ]);
            if (!gasLimit?.isFinite()) {
                return null;
            }
            const increasedGasLimit = web3_pure_1.Web3Pure.calculateGasMargin(gasLimit, 1.2);
            return {
                gasLimit: increasedGasLimit,
                ...gasDetails
            };
        }
        catch (_err) {
            return null;
        }
    }
    get fromBlockchain() {
        return this.from.blockchain;
    }
    get fromContractAddress() {
        return this.allowanceTarget;
    }
    get methodName() {
        return '';
    }
    constructor(crossChainTrade, providerAddress) {
        super(providerAddress);
        this.useProxyByDefault = false;
        this.type = cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.DEBRIDGE;
        this.isAggregator = false;
        this.onChainSubtype = {
            from: on_chain_trade_type_1.ON_CHAIN_TRADE_TYPE.ONE_INCH,
            to: on_chain_trade_type_1.ON_CHAIN_TRADE_TYPE.ONE_INCH
        };
        this.bridgeType = bridge_type_1.BRIDGE_TYPE.DEBRIDGE;
        this.from = crossChainTrade.from;
        this.to = crossChainTrade.to;
        this.transactionRequest = crossChainTrade.transactionRequest;
        this.gasData = crossChainTrade.gasData;
        this.priceImpact = crossChainTrade.priceImpact;
        this.allowanceTarget = crossChainTrade.allowanceTarget;
        this.slippage = crossChainTrade.slippage;
        this.onChainTrade = crossChainTrade.onChainTrade;
        this.toTokenAmountMin = this.to.tokenAmount.multipliedBy(1 - crossChainTrade.slippage);
        this.feeInfo = crossChainTrade.feeInfo;
        this.cryptoFeeToken = crossChainTrade.cryptoFeeToken;
        this.transitAmount = crossChainTrade.transitAmount;
    }
    async swapDirect(options = {}) {
        this.checkWalletConnected();
        await this.checkAllowanceAndApprove(options);
        let transactionHash;
        try {
            const { data, value, to } = await this.getTransactionRequest(options?.receiverAddress);
            const { onConfirm } = options;
            const onTransactionHash = (hash) => {
                if (onConfirm) {
                    onConfirm(hash);
                }
                transactionHash = hash;
            };
            await this.web3Private.trySendTransaction(to, {
                onTransactionHash,
                data,
                value,
                gas: options.gasLimit,
                gasPrice: options.gasPrice,
                gasPriceOptions: options.gasPriceOptions
            });
            return transactionHash;
        }
        catch (err) {
            if (err?.error?.errorId === 'ERROR_LOW_GIVE_AMOUNT') {
                throw new errors_1.TooLowAmountError();
            }
            if (err instanceof errors_1.FailedToCheckForTransactionReceiptError) {
                return transactionHash;
            }
            throw (0, errors_2.parseError)(err);
        }
    }
    async getContractParams(options) {
        const { data, value: providerValue } = await this.getTransactionRequest(options?.receiverAddress);
        const bridgeData = this.getBridgeData(options);
        const swapData = this.onChainTrade && (await this.getSwapData(options));
        const providerData = this.getProviderData(data);
        const methodArguments = swapData
            ? [bridgeData, swapData, providerData]
            : [bridgeData, providerData];
        const methodName = swapData
            ? 'swapAndStartBridgeTokensViaDeBridge'
            : 'startBridgeTokensViaDeBridge';
        const value = this.getSwapValue(providerValue);
        return {
            contractAddress: this.fromContractAddress,
            contractAbi: evm_common_cross_chain_abi_1.evmCommonCrossChainAbi,
            methodName,
            methodArguments,
            value
        };
    }
    getTradeAmountRatio(fromUsd) {
        const usdCryptoFee = this.cryptoFeeToken.price.multipliedBy(this.cryptoFeeToken.tokenAmount);
        return fromUsd.plus(usdCryptoFee.isNaN() ? 0 : usdCryptoFee).dividedBy(this.to.tokenAmount);
    }
    async getTransactionRequest(receiverAddress) {
        const walletAddress = this.web3Private.address;
        const params = {
            ...this.transactionRequest,
            ...(receiverAddress && { dstChainTokenOutRecipient: receiverAddress }),
            // @TODO Check proxy when deBridge proxy returned
            senderAddress: walletAddress,
            srcChainRefundAddress: walletAddress,
            dstChainOrderAuthorityAddress: receiverAddress || walletAddress,
            srcChainOrderAuthorityAddress: receiverAddress || walletAddress,
            referralCode: '4350'
        };
        const { tx, estimation } = await injector_1.Injector.httpClient.get(`${debridge_cross_chain_provider_1.DebridgeCrossChainProvider.apiEndpoint}/order/create-tx`, { params });
        await this.checkOrderAmount(estimation);
        return tx;
    }
    getUsdPrice() {
        return this.transitAmount;
    }
    getTradeInfo() {
        return {
            estimatedGas: this.estimatedGas,
            feeInfo: this.feeInfo,
            priceImpact: this.priceImpact ?? null,
            slippage: 0
        };
    }
    getBridgeData(options) {
        const receiverAddress = options?.receiverAddress || this.walletAddress;
        const toChainId = blockchain_id_1.blockchainId[this.to.blockchain];
        const fromToken = this.onChainTrade ? this.onChainTrade.to : this.from;
        const hasSwapBeforeBridge = this.onChainTrade !== null;
        return [
            evm_web3_pure_1.EvmWeb3Pure.randomHex(32),
            `native:${this.type.toLowerCase()}`,
            this.providerAddress,
            evm_web3_pure_1.EvmWeb3Pure.randomHex(20),
            fromToken.address,
            receiverAddress,
            fromToken.stringWeiAmount,
            toChainId,
            hasSwapBeforeBridge,
            false
        ];
    }
    async getSwapData(options) {
        const fromAddress = options.fromAddress || this.walletAddress || constants_1.oneinchApiParams.nativeAddress;
        const swapData = await this.onChainTrade.encode({
            fromAddress,
            receiverAddress: this.fromContractAddress
        });
        return [
            [
                swapData.to,
                swapData.to,
                this.from.address,
                this.onChainTrade.to.address,
                this.from.stringWeiAmount,
                swapData.data,
                true
            ]
        ];
    }
    getProviderData(sourceData) {
        const targetCallData = this.decodeCallData(sourceData);
        const portalAddress = portal_address_1.portalAddresses[this.fromBlockchain];
        return [
            '0x',
            '0x',
            evm_web3_pure_1.EvmWeb3Pure.EMPTY_ADDRESS,
            this.from.address,
            evm_web3_pure_1.EvmWeb3Pure.EMPTY_ADDRESS,
            evm_web3_pure_1.EvmWeb3Pure.EMPTY_ADDRESS,
            portalAddress,
            targetCallData
        ];
    }
    decodeCallData(data) {
        if (typeof data === 'string') {
            const decodeData = decode_method_1.MethodDecoder.decodeMethod(mete_router_abi_1.meteRouterAbi.find(method => method.name === 'metaRoute'), data).params[0].value;
            return decodeData.otherSideCalldata;
        }
        throw new errors_1.RubicSdkError('Wrong call data');
    }
    async checkOrderAmount(estimation) {
        const newAmount = web3_pure_1.Web3Pure.fromWei(estimation.dstChainTokenOut.amount, this.to.decimals);
        const acceptableExpensesChangePercent = 3;
        const acceptablePriceChangeFromAmount = 0.05;
        const feeAmount = web3_pure_1.Web3Pure.fromWei(estimation.costsDetails.find(fee => fee.type === 'EstimatedOperatingExpenses')?.payload
            .feeAmount || '0', this.to.decimals);
        const acceptablePriceChangeFromExpenses = feeAmount
            .dividedBy(newAmount)
            .multipliedBy(acceptableExpensesChangePercent);
        const acceptablePriceChange = acceptablePriceChangeFromExpenses.plus(acceptablePriceChangeFromAmount);
        const amountPlusPercent = this.to.tokenAmount.multipliedBy(acceptablePriceChange.dividedBy(100).plus(1));
        const amountMinusPercent = this.to.tokenAmount.multipliedBy(new bignumber_js_1.default(1).minus(acceptablePriceChange.dividedBy(100)));
        if (amountPlusPercent.lt(newAmount) || amountMinusPercent.gt(newAmount)) {
            const newTo = await tokens_1.PriceTokenAmount.createFromToken({
                ...this.to,
                tokenAmount: newAmount
            });
            throw new updated_rates_error_1.UpdatedRatesError(new DebridgeCrossChainTrade({
                from: this.from,
                to: newTo,
                transactionRequest: this.transactionRequest,
                gasData: this.gasData,
                priceImpact: this.from.calculatePriceImpactPercent(newTo),
                allowanceTarget: this.allowanceTarget,
                slippage: 0,
                feeInfo: this.feeInfo,
                transitAmount: this.transitAmount,
                cryptoFeeToken: this.cryptoFeeToken,
                onChainTrade: null
            }, this.providerAddress));
        }
    }
}
exports.DebridgeCrossChainTrade = DebridgeCrossChainTrade;
//# sourceMappingURL=debridge-cross-chain-trade.js.map