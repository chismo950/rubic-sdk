"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossChainTrade = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const errors_1 = require("../../../../../common/errors");
const tokens_1 = require("../../../../../common/tokens");
const web3_pure_1 = require("../../../../../core/blockchain/web3-pure/web3-pure");
const injector_1 = require("../../../../../core/injector/injector");
const check_address_1 = require("../../../../common/utils/check-address");
/**
 * Abstract class for all cross-chain providers' trades.
 */
class CrossChainTrade {
    get httpClient() {
        return injector_1.Injector.httpClient;
    }
    get fromWeb3Public() {
        return injector_1.Injector.web3PublicService.getWeb3Public(this.from.blockchain);
    }
    get web3Private() {
        return injector_1.Injector.web3PrivateService.getWeb3PrivateByBlockchain(this.from.blockchain);
    }
    get walletAddress() {
        return this.web3Private.address;
    }
    get networkFee() {
        return new bignumber_js_1.default(this.feeInfo.rubicProxy?.fixedFee?.amount || 0).plus(this.feeInfo.provider?.cryptoFee?.amount || 0);
    }
    get platformFee() {
        return new bignumber_js_1.default(this.feeInfo.rubicProxy?.platformFee?.percent || 0).plus(this.feeInfo.provider?.platformFee?.percent || 0);
    }
    get isProxyTrade() {
        const fee = this.feeInfo.rubicProxy;
        const hasFixedFee = Boolean(fee?.fixedFee?.amount?.gt(0));
        const hasPlatformFee = Number(fee?.platformFee?.percent) > 0;
        return hasFixedFee || hasPlatformFee;
    }
    constructor(providerAddress) {
        this.providerAddress = providerAddress;
    }
    /**
     * Returns true, if allowance is not enough.
     */
    async needApprove() {
        this.checkWalletConnected();
        if (this.from.isNative) {
            return false;
        }
        const allowance = await this.fromWeb3Public.getAllowance(this.from.address, this.walletAddress, this.fromContractAddress);
        return this.from.weiAmount.gt(allowance);
    }
    async checkTradeErrors() {
        this.checkWalletConnected();
        await Promise.all([this.checkBlockchainCorrect(), this.checkUserBalance()]);
    }
    checkWalletConnected() {
        if (!this.walletAddress) {
            throw new errors_1.WalletNotConnectedError();
        }
    }
    async checkBlockchainCorrect() {
        await this.web3Private.checkBlockchainCorrect(this.from.blockchain);
    }
    async checkUserBalance() {
        await this.fromWeb3Public.checkBalance(this.from, this.from.tokenAmount, this.walletAddress);
    }
    async checkFromAddress(fromAddress, isRequired = false, crossChainType) {
        if (!fromAddress) {
            if (isRequired) {
                throw new errors_1.RubicSdkError(`'fromAddress' is required option`);
            }
            return;
        }
        const isAddressCorrectValue = await (0, check_address_1.isAddressCorrect)(fromAddress, this.from.blockchain, crossChainType);
        if (!isAddressCorrectValue) {
            throw new errors_1.WrongFromAddressError();
        }
    }
    async checkReceiverAddress(receiverAddress, isRequired = false, crossChainType) {
        if (!receiverAddress) {
            if (isRequired) {
                throw new errors_1.RubicSdkError(`'receiverAddress' is required option`);
            }
            return;
        }
        const isAddressCorrectValue = await (0, check_address_1.isAddressCorrect)(receiverAddress, this.to.blockchain, crossChainType);
        if (!isAddressCorrectValue) {
            throw new errors_1.WrongReceiverAddressError();
        }
    }
    /**
     * Calculates value for swap transaction.
     * @param providerValue Value, returned from cross-chain provider.
     */
    getSwapValue(providerValue) {
        const nativeToken = tokens_1.nativeTokensList[this.from.blockchain];
        const fixedFeeValue = web3_pure_1.Web3Pure.toWei(this.feeInfo.rubicProxy?.fixedFee?.amount || 0, nativeToken.decimals);
        let fromValue;
        if (this.from.isNative) {
            if (providerValue) {
                fromValue = new bignumber_js_1.default(providerValue).dividedBy(1 - (this.feeInfo.rubicProxy?.platformFee?.percent || 0) / 100);
            }
            else {
                fromValue = this.from.weiAmount;
            }
        }
        else {
            fromValue = new bignumber_js_1.default(providerValue || 0);
        }
        return new bignumber_js_1.default(fromValue).plus(fixedFeeValue).toFixed(0, 0);
    }
}
exports.CrossChainTrade = CrossChainTrade;
//# sourceMappingURL=cross-chain-trade.js.map