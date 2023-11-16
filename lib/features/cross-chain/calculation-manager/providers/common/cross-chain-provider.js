"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossChainProvider = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const errors_1 = require("../../../../../common/errors");
const tokens_1 = require("../../../../../common/tokens");
const errors_2 = require("../../../../../common/utils/errors");
const blockchains_info_1 = require("../../../../../core/blockchain/utils/blockchains-info/blockchains-info");
const web3_pure_1 = require("../../../../../core/blockchain/web3-pure/web3-pure");
const injector_1 = require("../../../../../core/injector/injector");
class CrossChainProvider {
    static parseError(err) {
        return (0, errors_2.parseError)(err, 'Cannot calculate cross-chain trade');
    }
    get httpClient() {
        return injector_1.Injector.httpClient;
    }
    areSupportedBlockchains(fromBlockchain, toBlockchain) {
        return (this.isSupportedBlockchain(fromBlockchain) && this.isSupportedBlockchain(toBlockchain));
    }
    getWalletAddress(blockchain) {
        return injector_1.Injector.web3PrivateService.getWeb3PrivateByBlockchain(blockchain).address;
    }
    /**
     * Gets fee information.
     * @param _fromBlockchain Source network blockchain.
     * @param _providerAddress Integrator address.
     * @param _percentFeeToken Protocol fee token.
     * @param _useProxy Use rubic proxy or not.
     * @param _contractAbi Rubic Proxy contract abi.
     * @protected
     * @internal
     */
    async getFeeInfo(_fromBlockchain, _providerAddress, _percentFeeToken, _useProxy, _contractAbi) {
        return {};
    }
    /**
     * Gets fixed fee information.
     * @param fromBlockchain Source network blockchain.
     * @param providerAddress Integrator address.
     * @param contractAddress Contract address.
     * @param contractAbi Contract ABI.
     * @protected
     * @internal
     */
    async getFixedFee(fromBlockchain, providerAddress, contractAddress, contractAbi) {
        const web3Public = injector_1.Injector.web3PublicService.getWeb3Public(fromBlockchain);
        const fromChainType = blockchains_info_1.BlockchainsInfo.getChainType(fromBlockchain);
        const nativeToken = tokens_1.nativeTokensList[fromBlockchain];
        if (!web3_pure_1.Web3Pure[fromChainType].isEmptyAddress(providerAddress)) {
            const integratorInfo = await web3Public.callContractMethod(contractAddress, contractAbi, 'integratorToFeeInfo', [providerAddress]);
            if (integratorInfo.isIntegrator) {
                return web3_pure_1.Web3Pure.fromWei(integratorInfo.fixedFeeAmount, nativeToken.decimals);
            }
        }
        return web3_pure_1.Web3Pure.fromWei(await web3Public.callContractMethod(contractAddress, contractAbi, 'fixedNativeFee'), nativeToken.decimals);
    }
    /**
     * Gets percent fee.
     * @param fromBlockchain Source network blockchain.
     * @param providerAddress Integrator address.
     * @param contractAddress Contract address.
     * @param contractAbi Contract ABI.
     * @protected
     * @internal
     */
    async getFeePercent(fromBlockchain, providerAddress, contractAddress, contractAbi) {
        const web3Public = injector_1.Injector.web3PublicService.getWeb3Public(fromBlockchain);
        const fromChainType = blockchains_info_1.BlockchainsInfo.getChainType(fromBlockchain);
        if (!web3_pure_1.Web3Pure[fromChainType].isEmptyAddress(providerAddress)) {
            const integratorInfo = await web3Public.callContractMethod(contractAddress, contractAbi, 'integratorToFeeInfo', [providerAddress]);
            if (integratorInfo.isIntegrator) {
                return new bignumber_js_1.default(integratorInfo.tokenFee).toNumber() / 10000;
            }
        }
        return (new bignumber_js_1.default(await web3Public.callContractMethod(contractAddress, contractAbi, 'RubicPlatformFee')).toNumber() / 10000);
    }
    async checkContractState(fromBlockchain, rubicRouter, contractAbi) {
        const web3PublicService = injector_1.Injector.web3PublicService.getWeb3Public(fromBlockchain);
        const isPaused = await web3PublicService.callContractMethod(rubicRouter, contractAbi, 'paused');
        if (isPaused) {
            throw new errors_1.CrossChainIsUnavailableError();
        }
    }
}
exports.CrossChainProvider = CrossChainProvider;
//# sourceMappingURL=cross-chain-provider.js.map