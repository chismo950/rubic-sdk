"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifiTrade = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const errors_1 = require("../../../../../common/errors");
const price_token_amount_1 = require("../../../../../common/tokens/price-token-amount");
const evm_web3_pure_1 = require("../../../../../core/blockchain/web3-pure/typed-web3-pure/evm-web3-pure/evm-web3-pure");
const injector_1 = require("../../../../../core/injector/injector");
const rubic_proxy_contract_address_1 = require("../../../../cross-chain/calculation-manager/providers/common/constants/rubic-proxy-contract-address");
const evm_on_chain_trade_1 = require("../common/on-chain-trade/evm-on-chain-trade/evm-on-chain-trade");
class LifiTrade extends evm_on_chain_trade_1.EvmOnChainTrade {
    /** @internal */
    static async getGasLimit(lifiTradeStruct) {
        const fromBlockchain = lifiTradeStruct.from.blockchain;
        const walletAddress = injector_1.Injector.web3PrivateService.getWeb3PrivateByBlockchain(fromBlockchain).address;
        if (!walletAddress) {
            return null;
        }
        const lifiTrade = new LifiTrade(lifiTradeStruct, evm_web3_pure_1.EvmWeb3Pure.EMPTY_ADDRESS);
        try {
            const transactionConfig = await lifiTrade.encode({ fromAddress: walletAddress });
            const web3Public = injector_1.Injector.web3PublicService.getWeb3Public(fromBlockchain);
            const gasLimit = (await web3Public.batchEstimatedGas(walletAddress, [transactionConfig]))[0];
            if (gasLimit?.isFinite()) {
                return gasLimit;
            }
        }
        catch { }
        try {
            const transactionData = await lifiTrade.getTransactionData(walletAddress);
            if (transactionData.gasLimit) {
                return new bignumber_js_1.default(transactionData.gasLimit);
            }
        }
        catch { }
        return null;
    }
    get spenderAddress() {
        return this.useProxy
            ? rubic_proxy_contract_address_1.rubicProxyContractAddress[this.from.blockchain].gateway
            : this.providerGateway;
    }
    get dexContractAddress() {
        throw new errors_1.RubicSdkError('Dex address is unknown before swap is started');
    }
    get toTokenAmountMin() {
        return this._toTokenAmountMin;
    }
    constructor(tradeStruct, providerAddress) {
        super(tradeStruct, providerAddress);
        this._toTokenAmountMin = new price_token_amount_1.PriceTokenAmount({
            ...this.to.asStruct,
            weiAmount: tradeStruct.toTokenWeiAmountMin
        });
        this.type = tradeStruct.type;
        this.route = tradeStruct.route;
        this.providerGateway = this.route.steps[0].estimate.approvalAddress;
    }
    async encodeDirect(options) {
        await this.checkFromAddress(options.fromAddress, true);
        await this.checkReceiverAddress(options.receiverAddress);
        try {
            const transactionData = await this.getTransactionData(options.fromAddress, options.receiverAddress);
            const { gas, gasPrice } = this.getGasParams(options, {
                gasLimit: transactionData.gasLimit,
                gasPrice: transactionData.gasPrice
            });
            return {
                to: transactionData.to,
                data: transactionData.data,
                value: this.fromWithoutFee.isNative ? this.fromWithoutFee.stringWeiAmount : '0',
                gas,
                gasPrice
            };
        }
        catch (err) {
            if ([400, 500, 503].includes(err.code)) {
                throw new errors_1.SwapRequestError();
            }
            if (this.isDeflationError()) {
                throw new errors_1.LowSlippageDeflationaryTokenError();
            }
            throw new errors_1.LifiPairIsUnavailableError();
        }
    }
    async getTransactionData(fromAddress, receiverAddress) {
        const firstStep = this.route.steps[0];
        const step = {
            ...firstStep,
            action: {
                ...firstStep.action,
                fromAddress: fromAddress || this.walletAddress,
                toAddress: receiverAddress || fromAddress || this.walletAddress
            },
            execution: {
                status: 'NOT_STARTED',
                process: [
                    {
                        message: 'Preparing swap.',
                        startedAt: Date.now(),
                        status: 'STARTED',
                        type: 'SWAP'
                    }
                ]
            }
        };
        const swapResponse = await this.httpClient.post('https://li.quest/v1/advanced/stepTransaction', {
            ...step
        });
        const { transactionRequest } = swapResponse;
        const gasLimit = transactionRequest.gasLimit && parseInt(transactionRequest.gasLimit, 16).toString();
        const gasPrice = transactionRequest.gasPrice && parseInt(transactionRequest.gasPrice, 16).toString();
        return {
            to: transactionRequest.to,
            data: transactionRequest.data,
            gasLimit,
            gasPrice
        };
    }
}
exports.LifiTrade = LifiTrade;
//# sourceMappingURL=lifi-trade.js.map