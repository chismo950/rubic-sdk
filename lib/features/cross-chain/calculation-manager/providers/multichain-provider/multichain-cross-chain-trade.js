"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultichainCrossChainTrade = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const blockchain_id_1 = require("../../../../../core/blockchain/utils/blockchains-info/constants/blockchain-id");
const evm_web3_pure_1 = require("../../../../../core/blockchain/web3-pure/typed-web3-pure/evm-web3-pure/evm-web3-pure");
const web3_pure_1 = require("../../../../../core/blockchain/web3-pure/web3-pure");
const injector_1 = require("../../../../../core/injector/injector");
const get_from_without_fee_1 = require("../../../../common/utils/get-from-without-fee");
const cross_chain_trade_type_1 = require("../../models/cross-chain-trade-type");
const rubic_proxy_contract_address_1 = require("../common/constants/rubic-proxy-contract-address");
const evm_common_cross_chain_abi_1 = require("../common/emv-cross-chain-trade/constants/evm-common-cross-chain-abi");
const gateway_rubic_cross_chain_abi_1 = require("../common/emv-cross-chain-trade/constants/gateway-rubic-cross-chain-abi");
const evm_cross_chain_trade_1 = require("../common/emv-cross-chain-trade/evm-cross-chain-trade");
const bridge_type_1 = require("../common/models/bridge-type");
const proxy_cross_chain_evm_trade_1 = require("../common/proxy-cross-chain-evm-facade/proxy-cross-chain-evm-trade");
const contract_abi_1 = require("./constants/contract-abi");
const convert_gas_price_1 = require("../../utils/convert-gas-price");
class MultichainCrossChainTrade extends evm_cross_chain_trade_1.EvmCrossChainTrade {
    /** @internal */
    static async getGasData(from, to, routerAddress, spenderAddress, multichainMethodName, anyTokenAddress, onChainTrade) {
        const fromBlockchain = from.blockchain;
        const walletAddress = injector_1.Injector.web3PrivateService.getWeb3PrivateByBlockchain(fromBlockchain).address;
        if (!walletAddress) {
            return null;
        }
        try {
            const { contractAddress, contractAbi, methodName, methodArguments, value } = await new MultichainCrossChainTrade({
                from,
                to,
                gasData: null,
                priceImpact: 0,
                toTokenAmountMin: new bignumber_js_1.default(0),
                feeInfo: {},
                routerAddress,
                spenderAddress,
                routerMethodName: multichainMethodName,
                anyTokenAddress,
                onChainTrade: onChainTrade,
                slippage: 0
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
    get methodName() {
        return this.onChainTrade
            ? 'swapAndStartBridgeTokensViaGenericCrossChain'
            : 'startBridgeTokensViaGenericCrossChain';
    }
    get fromContractAddress() {
        return this.isProxyTrade
            ? rubic_proxy_contract_address_1.rubicProxyContractAddress[this.from.blockchain].gateway
            : this.routerAddress;
    }
    constructor(crossChainTrade, providerAddress) {
        super(providerAddress);
        this.type = cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.MULTICHAIN;
        this.isAggregator = false;
        this.bridgeType = bridge_type_1.BRIDGE_TYPE.MULTICHAIN;
        this.from = crossChainTrade.from;
        this.to = crossChainTrade.to;
        this.gasData = crossChainTrade.gasData;
        this.priceImpact = crossChainTrade.priceImpact;
        this.toTokenAmountMin = crossChainTrade.toTokenAmountMin;
        this.feeInfo = crossChainTrade.feeInfo;
        this.routerAddress = crossChainTrade.routerAddress;
        this.spenderAddress = crossChainTrade.spenderAddress;
        this.routerMethodName = crossChainTrade.routerMethodName;
        this.anyTokenAddress = crossChainTrade.anyTokenAddress;
        this.slippage = crossChainTrade.slippage;
        this.onChainSubtype = crossChainTrade.onChainTrade
            ? { from: crossChainTrade.onChainTrade?.type, to: undefined }
            : { from: undefined, to: undefined };
        this.onChainTrade = crossChainTrade.onChainTrade;
    }
    async swapDirect(options) {
        await this.checkTradeErrors();
        await this.checkAllowanceAndApprove(options);
        const { onConfirm, gasLimit, gasPrice, gasPriceOptions } = options;
        const onTransactionHash = (hash) => {
            if (onConfirm) {
                onConfirm(hash);
            }
        };
        // eslint-disable-next-line no-useless-catch
        try {
            const toChainId = blockchain_id_1.blockchainId[this.to.blockchain];
            const receiverAddress = options?.receiverAddress || this.walletAddress;
            const fromAmountWithoutFee = (0, get_from_without_fee_1.getFromWithoutFee)(this.from, this.feeInfo.rubicProxy?.platformFee?.percent).stringWeiAmount;
            let multichainMethodArguments;
            if (this.routerMethodName === 'anySwapOutNative') {
                multichainMethodArguments = [this.anyTokenAddress, receiverAddress, toChainId];
            }
            else {
                multichainMethodArguments = [
                    this.anyTokenAddress,
                    receiverAddress,
                    fromAmountWithoutFee,
                    toChainId
                ];
            }
            const value = this.getSwapValue();
            const receipt = await this.web3Private.tryExecuteContractMethod(this.routerAddress, contract_abi_1.multichainContractAbi, this.routerMethodName, multichainMethodArguments, {
                value,
                onTransactionHash,
                gas: gasLimit,
                gasPrice,
                gasPriceOptions
            });
            return receipt.blockHash;
        }
        catch (err) {
            throw err;
        }
    }
    async getContractParams(options) {
        const bridgeData = proxy_cross_chain_evm_trade_1.ProxyCrossChainEvmTrade.getBridgeData(options, {
            walletAddress: this.walletAddress,
            fromTokenAmount: this.from,
            toTokenAmount: this.to,
            srcChainTrade: this.onChainTrade,
            providerAddress: this.providerAddress,
            type: `native:${this.type}`,
            fromAddress: this.walletAddress
        });
        const swapData = this.onChainTrade &&
            (await proxy_cross_chain_evm_trade_1.ProxyCrossChainEvmTrade.getSwapData(options, {
                walletAddress: this.walletAddress,
                contractAddress: rubic_proxy_contract_address_1.rubicProxyContractAddress[this.from.blockchain].router,
                fromTokenAmount: this.from,
                toTokenAmount: this.onChainTrade.to,
                onChainEncodeFn: this.onChainTrade.encode.bind(this.onChainTrade)
            }));
        let providerData = [this.routerAddress];
        if (this.routerMethodName !== 'Swapout') {
            const { data, to: providerRouter } = this.getSwapData(options);
            providerData = await proxy_cross_chain_evm_trade_1.ProxyCrossChainEvmTrade.getGenericProviderData(providerRouter, data, this.from.blockchain, providerRouter, '0');
        }
        const methodArguments = swapData
            ? [bridgeData, swapData, providerData]
            : [bridgeData, providerData];
        const value = this.getSwapValue();
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
    getSwapData(options) {
        const toChainId = blockchain_id_1.blockchainId[this.to.blockchain];
        const receiverAddress = options?.receiverAddress || this.walletAddress;
        const fromAmountWithoutFee = (0, get_from_without_fee_1.getFromWithoutFee)(this.from, this.feeInfo.rubicProxy?.platformFee?.percent).stringWeiAmount;
        let multichainMethodArguments;
        if (this.routerMethodName === 'anySwapOutNative') {
            multichainMethodArguments = [this.anyTokenAddress, receiverAddress, toChainId];
        }
        else {
            multichainMethodArguments = [
                this.anyTokenAddress,
                receiverAddress,
                fromAmountWithoutFee,
                toChainId
            ];
        }
        const fromToken = this.onChainTrade ? this.onChainTrade.to : this.from;
        const value = fromToken.isNative ? fromAmountWithoutFee : '0';
        return evm_web3_pure_1.EvmWeb3Pure.encodeMethodCall(this.routerAddress, contract_abi_1.multichainContractAbi, this.routerMethodName, multichainMethodArguments, value);
    }
}
exports.MultichainCrossChainTrade = MultichainCrossChainTrade;
//# sourceMappingURL=multichain-cross-chain-trade.js.map