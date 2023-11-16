"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XyDexTrade = void 0;
const errors_1 = require("../../../../../../../common/errors");
const errors_2 = require("../../../../../../../common/utils/errors");
const blockchain_id_1 = require("../../../../../../../core/blockchain/utils/blockchains-info/constants/blockchain-id");
const evm_web3_pure_1 = require("../../../../../../../core/blockchain/web3-pure/typed-web3-pure/evm-web3-pure/evm-web3-pure");
const injector_1 = require("../../../../../../../core/injector/injector");
const on_chain_trade_type_1 = require("../../../common/models/on-chain-trade-type");
const evm_on_chain_trade_1 = require("../../../common/on-chain-trade/evm-on-chain-trade/evm-on-chain-trade");
const constants_1 = require("./constants");
const xy_dex_abstract_provider_1 = require("./xy-dex-abstract-provider");
class XyDexTrade extends evm_on_chain_trade_1.EvmOnChainTrade {
    /** @internal */
    static async getGasLimit(tradeStruct) {
        const fromBlockchain = tradeStruct.from.blockchain;
        const walletAddress = injector_1.Injector.web3PrivateService.getWeb3PrivateByBlockchain(fromBlockchain).address;
        if (!walletAddress) {
            return null;
        }
        try {
            const transactionConfig = await new XyDexTrade(tradeStruct, evm_web3_pure_1.EvmWeb3Pure.EMPTY_ADDRESS).encode({ fromAddress: walletAddress });
            const web3Public = injector_1.Injector.web3PublicService.getWeb3Public(fromBlockchain);
            const gasLimit = (await web3Public.batchEstimatedGas(walletAddress, [transactionConfig]))[0];
            if (!gasLimit?.isFinite()) {
                return null;
            }
            return gasLimit;
        }
        catch (_err) {
            return null;
        }
    }
    /** @internal */
    static async checkIfNeedApproveAndThrowError(from, fromAddress, useProxy) {
        const needApprove = await new XyDexTrade({
            from,
            useProxy
        }, evm_web3_pure_1.EvmWeb3Pure.EMPTY_ADDRESS).needApprove(fromAddress);
        if (needApprove) {
            throw new errors_1.RubicSdkError('Approve is needed');
        }
    }
    constructor(tradeStruct, providerAddress) {
        super(tradeStruct, providerAddress);
        this.type = on_chain_trade_type_1.ON_CHAIN_TRADE_TYPE.XY_DEX;
        this.dexContractAddress = tradeStruct.contractAddress;
        this.provider = tradeStruct.provider;
    }
    async encodeDirect(options) {
        await this.checkFromAddress(options.fromAddress, true);
        await this.checkReceiverAddress(options.receiverAddress);
        try {
            const apiTradeData = await this.getTradeData(options.receiverAddress);
            return apiTradeData.tx;
            // const gasPriceInfo = await getGasPriceInfo(this.from.blockchain);
            //
            // const { gas, gasPrice } = getGasFeeInfo(apiTradeData.routers[0]!.estimatedGas, gasPriceInfo);
            //
            // return {
            //     ...apiTradeData.tx,
            //     gas,
            //     gasPrice
            // };
        }
        catch (err) {
            throw (0, errors_2.parseError)(err, err?.response?.data?.description || err.message);
        }
    }
    async getTradeData(receiverAddress) {
        const receiver = receiverAddress || this.walletAddress;
        const chainId = blockchain_id_1.blockchainId[this.from.blockchain];
        const srcQuoteTokenAddress = this.from.isNative
            ? constants_1.xyApiParams.nativeAddress
            : this.from.address;
        const dstQuoteTokenAddress = this.to.isNative ? constants_1.xyApiParams.nativeAddress : this.to.address;
        const quoteTradeParams = {
            srcChainId: chainId,
            srcQuoteTokenAddress,
            srcQuoteTokenAmount: this.from.stringWeiAmount,
            dstChainId: chainId,
            dstQuoteTokenAddress,
            slippage: this.slippageTolerance * 100,
            receiver,
            srcSwapProvider: this.provider
        };
        return this.httpClient.get(`${xy_dex_abstract_provider_1.XyDexAbstractProvider.apiUrl}buildTx`, {
            params: { ...quoteTradeParams }
        });
    }
}
exports.XyDexTrade = XyDexTrade;
//# sourceMappingURL=xy-dex-trade.js.map