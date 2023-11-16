"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifiProvider = void 0;
const sdk_1 = require("@lifi/sdk");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const errors_1 = require("../../../../../common/errors");
const tokens_1 = require("../../../../../common/tokens");
const object_1 = require("../../../../../common/utils/object");
const options_1 = require("../../../../../common/utils/options");
const blockchain_id_1 = require("../../../../../core/blockchain/utils/blockchains-info/constants/blockchain-id");
const lifi_config_1 = require("../../../../common/providers/lifi/constants/lifi-config");
const get_from_without_fee_1 = require("../../../../common/utils/get-from-without-fee");
const on_chain_trade_type_1 = require("../common/models/on-chain-trade-type");
const on_chain_proxy_service_1 = require("../common/on-chain-proxy-service/on-chain-proxy-service");
const get_gas_fee_info_1 = require("../common/utils/get-gas-fee-info");
const get_gas_price_info_1 = require("../common/utils/get-gas-price-info");
const evm_provider_default_options_1 = require("../dexes/common/on-chain-provider/evm-on-chain-provider/constants/evm-provider-default-options");
const lifi_forbidden_blockchains_1 = require("./constants/lifi-forbidden-blockchains");
const lifi_providers_1 = require("./constants/lifi-providers");
const lifi_trade_1 = require("./lifi-trade");
class LifiProvider {
    constructor() {
        this.lifi = new sdk_1.LiFi((0, lifi_config_1.getLifiConfig)());
        this.onChainProxyService = new on_chain_proxy_service_1.OnChainProxyService();
        this.defaultOptions = {
            ...evm_provider_default_options_1.evmProviderDefaultOptions,
            gasCalculation: 'calculate'
        };
    }
    isForbiddenBlockchain(blockchain) {
        return lifi_forbidden_blockchains_1.lifiForbiddenBlockchains.some(supportedBlockchain => supportedBlockchain === blockchain);
    }
    async calculate(from, toToken, options) {
        if (this.isForbiddenBlockchain(from.blockchain)) {
            throw new errors_1.RubicSdkError('Blockchain is not supported');
        }
        const fullOptions = (0, options_1.combineOptions)(options, {
            ...this.defaultOptions,
            disabledProviders: [...options.disabledProviders, on_chain_trade_type_1.ON_CHAIN_TRADE_TYPE.DODO]
        });
        const { fromWithoutFee, proxyFeeInfo } = await this.handleProxyContract(from, fullOptions);
        const fromChainId = blockchain_id_1.blockchainId[from.blockchain];
        const toChainId = blockchain_id_1.blockchainId[toToken.blockchain];
        const { disabledProviders } = fullOptions;
        const lifiDisabledProviders = Object.entries(lifi_providers_1.lifiProviders)
            .filter(([_lifiProviderKey, tradeType]) => disabledProviders.includes(tradeType))
            .map(([lifiProviderKey]) => lifiProviderKey);
        const routeOptions = {
            order: 'RECOMMENDED',
            slippage: fullOptions.slippageTolerance,
            exchanges: {
                deny: lifiDisabledProviders.concat('openocean')
            }
        };
        const routesRequest = {
            fromChainId,
            fromAmount: fromWithoutFee.stringWeiAmount,
            fromTokenAddress: fromWithoutFee.address,
            toChainId,
            toTokenAddress: toToken.address,
            options: routeOptions
        };
        const result = await this.lifi.getRoutes(routesRequest);
        const { routes } = result;
        return (await Promise.all(routes.map(async (route) => {
            const step = route.steps[0];
            if (!step) {
                return null;
            }
            const type = lifi_providers_1.lifiProviders[step.toolDetails.name.toLowerCase()];
            if (!type) {
                return null;
            }
            const to = new tokens_1.PriceTokenAmount({
                ...toToken.asStruct,
                weiAmount: new bignumber_js_1.default(route.toAmount)
            });
            const path = await this.getPath(step, from, to);
            let lifiTradeStruct = {
                from,
                to,
                gasFeeInfo: null,
                slippageTolerance: fullOptions.slippageTolerance,
                type,
                path,
                route,
                toTokenWeiAmountMin: new bignumber_js_1.default(route.toAmountMin),
                useProxy: fullOptions.useProxy,
                proxyFeeInfo,
                fromWithoutFee,
                withDeflation: fullOptions.withDeflation
            };
            const gasFeeInfo = fullOptions.gasCalculation === 'disabled'
                ? null
                : await this.getGasFeeInfo(lifiTradeStruct);
            lifiTradeStruct = {
                ...lifiTradeStruct,
                gasFeeInfo
            };
            return new lifi_trade_1.LifiTrade(lifiTradeStruct, fullOptions.providerAddress);
        }))).filter(object_1.notNull);
    }
    async handleProxyContract(from, fullOptions) {
        let fromWithoutFee;
        let proxyFeeInfo;
        if (fullOptions.useProxy) {
            proxyFeeInfo = await this.onChainProxyService.getFeeInfo(from, fullOptions.providerAddress);
            fromWithoutFee = (0, get_from_without_fee_1.getFromWithoutFee)(from, proxyFeeInfo.platformFee.percent);
        }
        else {
            fromWithoutFee = from;
        }
        return {
            fromWithoutFee,
            proxyFeeInfo
        };
    }
    async getGasFeeInfo(lifiTradeStruct) {
        try {
            const gasPriceInfo = await (0, get_gas_price_info_1.getGasPriceInfo)(lifiTradeStruct.from.blockchain);
            const gasLimit = await lifi_trade_1.LifiTrade.getGasLimit(lifiTradeStruct);
            return (0, get_gas_fee_info_1.getGasFeeInfo)(gasLimit, gasPriceInfo);
        }
        catch {
            return null;
        }
    }
    async getPath(step, from, to) {
        const estimatedPath = step.includedSteps
            .map(item => {
            return [item.action.fromToken.address, item.action.toToken.address];
        })
            .flat();
        return estimatedPath
            ? await tokens_1.Token.createTokens(estimatedPath, from.blockchain)
            : [from, to];
    }
}
exports.LifiProvider = LifiProvider;
//# sourceMappingURL=lifi-provider.js.map