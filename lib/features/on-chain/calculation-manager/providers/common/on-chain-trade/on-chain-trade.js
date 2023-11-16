"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnChainTrade = void 0;
const errors_1 = require("../../../../../../common/errors");
const tokens_1 = require("../../../../../../common/tokens");
const decorators_1 = require("../../../../../../common/utils/decorators");
const injector_1 = require("../../../../../../core/injector/injector");
const check_address_1 = require("../../../../../common/utils/check-address");
/**
 * Abstract class for all instant trade providers' trades.
 */
class OnChainTrade {
    /**
     * Minimum amount of output token user can get.
     */
    get toTokenAmountMin() {
        const weiAmountOutMin = this.to.weiAmountMinusSlippage(this.slippageTolerance);
        return new tokens_1.PriceTokenAmount({ ...this.to.asStruct, weiAmount: weiAmountOutMin });
    }
    get web3Public() {
        return injector_1.Injector.web3PublicService.getWeb3Public(this.from.blockchain);
    }
    get web3Private() {
        return injector_1.Injector.web3PrivateService.getWeb3PrivateByBlockchain(this.from.blockchain);
    }
    get walletAddress() {
        return this.web3Private.address;
    }
    get httpClient() {
        return injector_1.Injector.httpClient;
    }
    /**
     * Price impact, based on tokens' usd prices.
     */
    get priceImpact() {
        return this.from.calculatePriceImpactPercent(this.to);
    }
    constructor(providerAddress) {
        this.providerAddress = providerAddress;
    }
    /**
     * Returns true, if allowance is not enough.
     */
    async needApprove(fromAddress) {
        if (!fromAddress) {
            this.checkWalletConnected();
        }
        if (this.from.isNative) {
            return false;
        }
        const allowance = await this.web3Public.getAllowance(this.from.address, fromAddress || this.walletAddress, this.spenderAddress);
        return allowance.lt(this.from.weiAmount);
    }
    async checkWalletState() {
        this.checkWalletConnected();
        await this.checkBlockchainCorrect();
        await this.checkBalance();
    }
    checkWalletConnected() {
        if (!this.walletAddress) {
            throw new errors_1.WalletNotConnectedError();
        }
    }
    async checkBlockchainCorrect() {
        await this.web3Private.checkBlockchainCorrect(this.from.blockchain);
    }
    async checkBalance() {
        await this.web3Public.checkBalance(this.from, this.from.tokenAmount, this.walletAddress);
    }
    async checkFromAddress(fromAddress, isRequired = false, chainType) {
        if (!fromAddress) {
            if (isRequired) {
                throw new errors_1.RubicSdkError(`'fromAddress' is required option`);
            }
            return;
        }
        const isAddressCorrectValue = await (0, check_address_1.isAddressCorrect)(fromAddress, this.from.blockchain, chainType);
        if (!isAddressCorrectValue) {
            throw new errors_1.WrongFromAddressError();
        }
    }
    async checkReceiverAddress(receiverAddress, isRequired = false, chainType) {
        if (!receiverAddress) {
            if (isRequired) {
                throw new errors_1.RubicSdkError(`'receiverAddress' is required option`);
            }
            return;
        }
        const isAddressCorrectValue = await (0, check_address_1.isAddressCorrect)(receiverAddress, this.from.blockchain, chainType);
        if (!isAddressCorrectValue) {
            throw new errors_1.WrongReceiverAddressError();
        }
    }
    getTradeInfo() {
        return {
            estimatedGas: null,
            feeInfo: this.feeInfo,
            priceImpact: this.priceImpact ?? null,
            slippage: this.slippageTolerance * 100
        };
    }
}
exports.OnChainTrade = OnChainTrade;
__decorate([
    decorators_1.Cache
], OnChainTrade.prototype, "priceImpact", null);
//# sourceMappingURL=on-chain-trade.js.map