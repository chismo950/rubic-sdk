"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnChainManager = void 0;
const errors_1 = require("../../../common/errors");
const tokens_1 = require("../../../common/tokens");
const options_1 = require("../../../common/utils/options");
const p_timeout_1 = __importDefault(require("../../../common/utils/p-timeout"));
const blockchains_info_1 = require("../../../core/blockchain/utils/blockchains-info/blockchains-info");
const get_price_tokens_from_input_tokens_1 = require("../../common/utils/get-price-tokens-from-input-tokens");
const default_provider_addresses_1 = require("../../cross-chain/calculation-manager/constants/default-provider-addresses");
const deflation_token_manager_1 = require("../../deflation-token-manager/deflation-token-manager");
const typed_trade_providers_1 = require("./constants/trade-providers/typed-trade-providers");
const evm_wrap_trade_1 = require("./providers/common/evm-wrap-trade/evm-wrap-trade");
const on_chain_proxy_service_1 = require("./providers/common/on-chain-proxy-service/on-chain-proxy-service");
const on_chain_trade_1 = require("./providers/common/on-chain-trade/on-chain-trade");
const lifi_provider_1 = require("./providers/lifi/lifi-provider");
const open_ocean_provider_1 = require("./providers/open-ocean/open-ocean-provider");
/**
 * Contains methods to calculate on-chain trades.
 */
class OnChainManager {
    constructor(providerAddress) {
        this.providerAddress = providerAddress;
        /**
         * List of all on-chain trade providers, combined by blockchains.
         */
        this.tradeProviders = typed_trade_providers_1.typedTradeProviders;
        this.lifiProvider = new lifi_provider_1.LifiProvider();
        this.openOceanProvider = new open_ocean_provider_1.OpenOceanProvider();
        this.deflationTokenManager = new deflation_token_manager_1.DeflationTokenManager();
    }
    /**
     * Calculates on-chain trades, sorted by output amount.
     *
     * @example
     * ```ts
     * const blockchain = BLOCKCHAIN_NAME.ETHEREUM;
     * // ETH
     * const fromTokenAddress = '0x0000000000000000000000000000000000000000';
     * const fromAmount = 1;
     * // USDT
     * const toTokenAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';
     *
     * const trades = await sdk.onChainManager.calculateTrade(
     *     { blockchain, address: fromTokenAddress },
     *     fromAmount,
     *     toTokenAddress
     * );
     * const bestTrade = trades[0];
     *
     * trades.forEach(trade => {
     *     if (trade instanceof OnChainTrade) {
     *         console.log(trade.type, `to amount: ${trade.to.tokenAmount.toFormat(3)}`)
     *     }
     * })
     * ```
     *
     * @param fromToken Token to sell.
     * @param fromAmount Amount to sell.
     * @param toToken Token to get.
     * @param options Additional options.
     * @returns List of calculated on-chain trades.
     */
    async calculateTrade(fromToken, fromAmount, toToken, options) {
        if (toToken instanceof tokens_1.Token && fromToken.blockchain !== toToken.blockchain) {
            throw new errors_1.RubicSdkError('Blockchains of from and to tokens must be same');
        }
        const { from, to } = await (0, get_price_tokens_from_input_tokens_1.getPriceTokensFromInputTokens)(fromToken, fromAmount.toString(), toToken);
        const fullOptions = await this.getFullOptions(from, to, options);
        return this.calculateTradeFromTokens(from, to, fullOptions);
    }
    async getFullOptions(from, to, options) {
        const chainType = blockchains_info_1.BlockchainsInfo.getChainType(from.blockchain);
        const [isDeflationFrom, isDeflationTo] = await Promise.all([
            this.isDeflationToken(from),
            this.isDeflationToken(to)
        ]);
        let useProxy;
        if (options?.useProxy === false) {
            useProxy = options.useProxy;
        }
        else {
            useProxy =
                on_chain_proxy_service_1.OnChainProxyService.isSupportedBlockchain(from.blockchain) &&
                    (!isDeflationFrom.isDeflation || isDeflationFrom.isWhitelisted);
        }
        return (0, options_1.combineOptions)({ ...options, useProxy }, {
            timeout: OnChainManager.defaultCalculationTimeout,
            disabledProviders: [],
            providerAddress: options?.providerAddress ||
                this.providerAddress?.[chainType]?.onChain ||
                default_provider_addresses_1.defaultProviderAddresses.onChain,
            useProxy,
            withDeflation: {
                from: isDeflationFrom,
                to: isDeflationTo
            }
        });
    }
    async calculateTradeFromTokens(from, to, options) {
        if ((from.isNative && to.isWrapped) || (from.isWrapped && to.isNative)) {
            return OnChainManager.getWrapTrade(from, to, options);
        }
        const dexesProviders = Object.entries(this.tradeProviders[from.blockchain]).filter(([type]) => !options.disabledProviders.includes(type));
        const dexesTradesPromise = this.calculateDexes(from, to, dexesProviders, options);
        const lifiTradesPromise = this.calculateLifiTrades(from, to, dexesProviders.map(dexProvider => dexProvider[0]), options);
        const openOceanTradePromise = this.openOceanProvider.calculate(from, to, options);
        const trades = (await Promise.all([dexesTradesPromise, lifiTradesPromise, openOceanTradePromise])).flat();
        return trades.sort((tradeA, tradeB) => {
            if (tradeA instanceof on_chain_trade_1.OnChainTrade || tradeB instanceof on_chain_trade_1.OnChainTrade) {
                if (tradeA instanceof on_chain_trade_1.OnChainTrade && tradeB instanceof on_chain_trade_1.OnChainTrade) {
                    return tradeA.to.tokenAmount.comparedTo(tradeB.to.tokenAmount);
                }
                return tradeA instanceof on_chain_trade_1.OnChainTrade ? 1 : -1;
            }
            return 0;
        });
    }
    isDeflationToken(token) {
        return this.deflationTokenManager.isDeflationToken(token);
    }
    async calculateDexes(from, to, dexesProviders, options) {
        return Promise.all(dexesProviders.map(async ([type, provider]) => {
            try {
                return await (0, p_timeout_1.default)(provider.calculate(from, to, options), options.timeout);
            }
            catch (e) {
                console.debug(`[RUBIC_SDK] Trade calculation error occurred for ${type} trade provider.`, e);
                return { type, error: e };
            }
        }));
    }
    async calculateLifiTrades(from, to, dexesProvidersTypes, options) {
        if (!blockchains_info_1.BlockchainsInfo.isEvmBlockchainName(from.blockchain)) {
            return [];
        }
        if (options.withDeflation.from.isDeflation) {
            console.debug('[RUBIC_SDK] Lifi does not work if source token is deflation.');
            return [];
        }
        try {
            const disabledProviders = dexesProvidersTypes.concat(options.disabledProviders);
            const calculationOptions = {
                ...options,
                gasCalculation: options.gasCalculation === 'disabled' ? 'disabled' : 'calculate',
                disabledProviders
            };
            return await this.lifiProvider.calculate(from, to, calculationOptions);
        }
        catch (err) {
            console.debug('[RUBIC_SDK] Trade calculation error occurred for lifi.', err);
            return [];
        }
    }
    static getWrapTrade(from, to, options) {
        const fromToken = from;
        const toToken = to;
        const trade = new evm_wrap_trade_1.EvmWrapTrade({
            from: fromToken,
            to: new tokens_1.PriceTokenAmount({
                ...toToken.asStruct,
                weiAmount: from.weiAmount
            }),
            slippageTolerance: 0,
            path: [from, to],
            gasFeeInfo: null,
            useProxy: false,
            proxyFeeInfo: undefined,
            fromWithoutFee: fromToken,
            withDeflation: {
                from: { isDeflation: false },
                to: { isDeflation: false }
            }
        }, options.providerAddress);
        return [trade];
    }
}
exports.OnChainManager = OnChainManager;
OnChainManager.defaultCalculationTimeout = 20000;
//# sourceMappingURL=on-chain-manager.js.map