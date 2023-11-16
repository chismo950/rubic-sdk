"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Public = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const errors_1 = require("../../../../common/errors");
const native_tokens_1 = require("../../../../common/tokens/constants/native-tokens");
const decorators_1 = require("../../../../common/utils/decorators");
const blockchains_info_1 = require("../../utils/blockchains-info/blockchains-info");
const multicall_addresses_1 = require("./constants/multicall-addresses");
const tron_web3_pure_1 = require("../../web3-pure/typed-web3-pure/tron-web3-pure/tron-web3-pure");
const web3_pure_1 = require("../../web3-pure/web3-pure");
/**
 * Class containing methods for calling contracts in order to obtain information from the blockchain.
 * To send transaction or execute contract method use {@link Web3Private}.
 */
class Web3Public {
    constructor(blockchainName) {
        this.blockchainName = blockchainName;
        this.multicallAddress = multicall_addresses_1.MULTICALL_ADDRESSES[this.blockchainName];
        this.Web3Pure = web3_pure_1.Web3Pure[blockchains_info_1.BlockchainsInfo.getChainType(this.blockchainName)];
    }
    /**
     * Gets balances of multiple tokens via multicall.
     * @param userAddress Wallet address, which contains tokens.
     * @param tokensAddresses Tokens addresses.
     */
    async getTokensBalances(userAddress, tokensAddresses) {
        const indexOfNativeCoin = tokensAddresses.findIndex(tron_web3_pure_1.TronWeb3Pure.isNativeAddress);
        const promises = [];
        if (indexOfNativeCoin !== -1) {
            tokensAddresses.splice(indexOfNativeCoin, 1);
            promises[1] = this.getBalance(userAddress);
        }
        promises[0] = this.multicallContractsMethods(this.tokenContractAbi, tokensAddresses.map(tokenAddress => ({
            contractAddress: tokenAddress,
            methodsData: [
                {
                    methodName: 'balanceOf',
                    methodArguments: [userAddress]
                }
            ]
        })));
        const results = await Promise.all(promises);
        const tokensBalances = results[0].map(tokenResults => {
            const { success, output } = tokenResults[0];
            return success ? new bignumber_js_1.default(output) : new bignumber_js_1.default(0);
        });
        if (indexOfNativeCoin !== -1) {
            tokensBalances.splice(indexOfNativeCoin, 0, results[1]);
        }
        return tokensBalances;
    }
    /**
     * Checks that user has enough balance.
     * @param userAddress Wallet address, which contains tokens.
     * @param token Token to check balance of.
     * @param requiredAmount Required user balance in Eth units.
     */
    async checkBalance(token, requiredAmount, userAddress) {
        const balanceWei = await this.getBalance(userAddress, token.address);
        const balance = web3_pure_1.Web3Pure.fromWei(balanceWei, token.decimals);
        if (balance.lt(requiredAmount)) {
            throw new errors_1.InsufficientFundsError(token, balance, requiredAmount);
        }
    }
    /**
     * Gets token info by address.
     * @param tokenAddress Address of token.
     * @param tokenFields Token's fields to get.
     */
    async callForTokenInfo(tokenAddress, tokenFields = ['decimals', 'symbol', 'name']) {
        return (await this.callForTokensInfo([tokenAddress], tokenFields))[0];
    }
    /**
     * Gets tokens info by addresses.
     * @param tokenAddresses Addresses of tokens.
     * @param tokenFields Token's fields to get.
     */
    async callForTokensInfo(tokenAddresses, tokenFields = ['decimals', 'symbol', 'name']) {
        const nativeTokenIndex = tokenAddresses.findIndex(address => this.Web3Pure.isNativeAddress(address));
        const filteredTokenAddresses = tokenAddresses.filter((_, index) => index !== nativeTokenIndex);
        const contractsData = filteredTokenAddresses.map(contractAddress => ({
            contractAddress,
            methodsData: tokenFields.map(methodName => ({
                methodName,
                methodArguments: []
            }))
        }));
        const results = contractsData.length
            ? await this.multicallContractsMethods(this.tokenContractAbi, contractsData)
            : [];
        const tokens = results.map((tokenFieldsResults, tokenIndex) => {
            const tokenAddress = tokenAddresses[tokenIndex];
            return tokenFieldsResults.reduce((acc, field, fieldIndex) => {
                if (!field.success) {
                    throw new errors_1.RubicSdkError(`Cannot retrieve information about ${tokenAddress}`);
                }
                return {
                    ...acc,
                    [tokenFields[fieldIndex]]: field.success ? field.output : undefined
                };
            }, {});
        });
        if (nativeTokenIndex === -1) {
            return tokens;
        }
        const blockchainNativeToken = native_tokens_1.nativeTokensList[this.blockchainName];
        const nativeToken = {
            ...blockchainNativeToken,
            decimals: blockchainNativeToken.decimals.toString()
        };
        tokens.splice(nativeTokenIndex, 0, nativeToken);
        return tokens;
    }
    /**
     * Uses multicall to make several calls of one method in one contract.
     * @param contractAddress Target contract address.
     * @param contractAbi Target contract abi.
     * @param methodName Method name.
     * @param methodCallsArguments Method parameters array, for each method call.
     */
    async multicallContractMethod(contractAddress, contractAbi, methodName, methodCallsArguments) {
        return this.multicallContractMethods(contractAddress, contractAbi, methodCallsArguments.map(methodArguments => ({
            methodName,
            methodArguments
        })));
    }
    /**
     * Uses multicall to make several methods calls in one contract.
     * @param contractAddress Target contract address.
     * @param contractAbi Target contract abi.
     * @param methodsData Methods data, containing methods' names and arguments.
     */
    async multicallContractMethods(contractAddress, contractAbi, methodsData) {
        const results = await this.multicallContractsMethods(contractAbi, [
            {
                contractAddress,
                methodsData
            }
        ]);
        if (!results?.[0]) {
            throw new errors_1.RubicSdkError('Cant perform multicall or request data is empty');
        }
        return results[0];
    }
}
exports.Web3Public = Web3Public;
__decorate([
    decorators_1.Cache
], Web3Public.prototype, "callForTokenInfo", null);
__decorate([
    decorators_1.Cache
], Web3Public.prototype, "callForTokensInfo", null);
//# sourceMappingURL=web3-public.js.map