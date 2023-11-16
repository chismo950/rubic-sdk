"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XyCrossChainTrade = void 0;
const updated_rates_error_1 = require("../../../../../common/errors/cross-chain/updated-rates-error");
const tokens_1 = require("../../../../../common/tokens");
const evm_web3_pure_1 = require("../../../../../core/blockchain/web3-pure/typed-web3-pure/evm-web3-pure/evm-web3-pure");
const web3_pure_1 = require("../../../../../core/blockchain/web3-pure/web3-pure");
const injector_1 = require("../../../../../core/injector/injector");
const cross_chain_trade_type_1 = require("../../models/cross-chain-trade-type");
const rubic_proxy_contract_address_1 = require("../common/constants/rubic-proxy-contract-address");
const evm_common_cross_chain_abi_1 = require("../common/emv-cross-chain-trade/constants/evm-common-cross-chain-abi");
const gateway_rubic_cross_chain_abi_1 = require("../common/emv-cross-chain-trade/constants/gateway-rubic-cross-chain-abi");
const evm_cross_chain_trade_1 = require("../common/emv-cross-chain-trade/evm-cross-chain-trade");
const bridge_type_1 = require("../common/models/bridge-type");
const proxy_cross_chain_evm_trade_1 = require("../common/proxy-cross-chain-evm-facade/proxy-cross-chain-evm-trade");
const xy_contract_address_1 = require("./constants/xy-contract-address");
const xy_cross_chain_provider_1 = require("./xy-cross-chain-provider");
const convert_gas_price_1 = require("../../utils/convert-gas-price");
/**
 * Calculated XY cross-chain trade.
 */
class XyCrossChainTrade extends evm_cross_chain_trade_1.EvmCrossChainTrade {
    /** @internal */
    static async getGasData(from, to, transactionRequest) {
        const fromBlockchain = from.blockchain;
        const walletAddress = injector_1.Injector.web3PrivateService.getWeb3PrivateByBlockchain(fromBlockchain).address;
        if (!walletAddress) {
            return null;
        }
        try {
            const { contractAddress, contractAbi, methodName, methodArguments, value } = await new XyCrossChainTrade({
                from,
                to,
                transactionRequest,
                gasData: null,
                priceImpact: 0,
                slippage: 0,
                feeInfo: {},
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
        return this.isProxyTrade
            ? rubic_proxy_contract_address_1.rubicProxyContractAddress[this.fromBlockchain].gateway
            : xy_contract_address_1.xyContractAddress[this.fromBlockchain].providerGateway;
    }
    get methodName() {
        return 'startBridgeTokensViaGenericCrossChain';
    }
    constructor(crossChainTrade, providerAddress) {
        super(providerAddress);
        this.type = cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.XY;
        this.isAggregator = false;
        this.onChainSubtype = {
            from: undefined,
            to: undefined
        };
        this.bridgeType = bridge_type_1.BRIDGE_TYPE.XY;
        this.from = crossChainTrade.from;
        this.to = crossChainTrade.to;
        this.transactionRequest = crossChainTrade.transactionRequest;
        this.gasData = crossChainTrade.gasData;
        this.priceImpact = crossChainTrade.priceImpact;
        this.slippage = crossChainTrade.slippage;
        this.toTokenAmountMin = this.to.tokenAmount.multipliedBy(1 - crossChainTrade.slippage);
        this.feeInfo = crossChainTrade.feeInfo;
        this.onChainTrade = crossChainTrade.onChainTrade;
    }
    async swapDirect(options = {}) {
        await this.checkTradeErrors();
        await this.checkAllowanceAndApprove(options);
        const { onConfirm, gasLimit, gasPrice, gasPriceOptions } = options;
        let transactionHash;
        const onTransactionHash = (hash) => {
            if (onConfirm) {
                onConfirm(hash);
            }
            transactionHash = hash;
        };
        // eslint-disable-next-line no-useless-catch
        try {
            const { data, value, to } = await this.getTransactionRequest(options?.receiverAddress);
            await this.web3Private.trySendTransaction(to, {
                data,
                value,
                onTransactionHash,
                gas: gasLimit,
                gasPrice,
                gasPriceOptions
            });
            return transactionHash;
        }
        catch (err) {
            throw err;
        }
    }
    async getContractParams(options) {
        const receiverAddress = options?.receiverAddress || this.walletAddress;
        const { data, value: providerValue, to: providerRouter } = await this.getTransactionRequest(receiverAddress);
        const bridgeData = proxy_cross_chain_evm_trade_1.ProxyCrossChainEvmTrade.getBridgeData(options, {
            walletAddress: receiverAddress,
            fromTokenAmount: this.from,
            toTokenAmount: this.to,
            srcChainTrade: null,
            providerAddress: this.providerAddress,
            type: `native:${this.type}`,
            fromAddress: this.walletAddress
        });
        const providerData = await proxy_cross_chain_evm_trade_1.ProxyCrossChainEvmTrade.getGenericProviderData(providerRouter, data, this.fromBlockchain, providerRouter, '0');
        const methodArguments = [bridgeData, providerData];
        const value = this.getSwapValue(providerValue);
        const transactionConfiguration = evm_web3_pure_1.EvmWeb3Pure.encodeMethodCall(rubic_proxy_contract_address_1.rubicProxyContractAddress[this.from.blockchain].router, evm_common_cross_chain_abi_1.evmCommonCrossChainAbi, this.methodName, methodArguments, value);
        const sendingToken = this.from.isNative ? [] : [this.from.address];
        const sendingAmount = this.from.isNative ? [] : [this.from.stringWeiAmount];
        return {
            contractAddress: rubic_proxy_contract_address_1.rubicProxyContractAddress[this.from.blockchain].gateway,
            contractAbi: gateway_rubic_cross_chain_abi_1.gatewayRubicCrossChainAbi,
            methodName: 'startViaRubic',
            methodArguments: [sendingToken, sendingAmount, transactionConfiguration.data],
            value
        };
    }
    getTradeAmountRatio(fromUsd) {
        return fromUsd.dividedBy(this.to.tokenAmount);
    }
    async getTransactionRequest(receiverAddress) {
        const params = {
            ...this.transactionRequest,
            ...(receiverAddress && { receiveAddress: receiverAddress })
        };
        const { tx, toTokenAmount } = await injector_1.Injector.httpClient.get(`${xy_cross_chain_provider_1.XyCrossChainProvider.apiEndpoint}/swap`, { params: { ...params } });
        await this.checkOrderAmount(toTokenAmount);
        return tx;
    }
    getUsdPrice() {
        return this.from.price.multipliedBy(this.from.tokenAmount);
    }
    getTradeInfo() {
        return {
            estimatedGas: this.estimatedGas,
            feeInfo: this.feeInfo,
            priceImpact: this.priceImpact ?? null,
            slippage: this.slippage * 100
        };
    }
    getProviderData(_sourceData) {
        return [
            this.to.address,
            web3_pure_1.Web3Pure.toWei(this.toTokenAmountMin, this.to.decimals),
            this.slippage * 10000
        ];
    }
    async checkOrderAmount(toTokenAmount) {
        const newAmount = web3_pure_1.Web3Pure.fromWei(toTokenAmount, this.to.decimals);
        const acceptableExpensesChangePercent = 2;
        const acceptableReductionChangePercent = 0.3;
        const amountPlusPercent = this.to.tokenAmount.plus(this.to.tokenAmount.multipliedBy(acceptableExpensesChangePercent).dividedBy(100));
        const amountMinusPercent = this.to.tokenAmount.minus(this.to.tokenAmount.multipliedBy(acceptableReductionChangePercent).dividedBy(100));
        if (newAmount.lt(amountMinusPercent) || newAmount.gt(amountPlusPercent)) {
            const newTo = await tokens_1.PriceTokenAmount.createFromToken({
                ...this.to,
                tokenAmount: newAmount
            });
            throw new updated_rates_error_1.UpdatedRatesError(new XyCrossChainTrade({
                from: this.from,
                to: newTo,
                transactionRequest: this.transactionRequest,
                gasData: this.gasData,
                priceImpact: this.from.calculatePriceImpactPercent(newTo),
                slippage: this.slippage,
                feeInfo: this.feeInfo,
                onChainTrade: null
            }, this.providerAddress));
        }
    }
}
exports.XyCrossChainTrade = XyCrossChainTrade;
XyCrossChainTrade.nativeAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
//# sourceMappingURL=xy-cross-chain-trade.js.map