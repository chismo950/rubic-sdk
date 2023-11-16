import { PriceToken, PriceTokenAmount, Token } from "../../../common/tokens";
import { BlockchainName } from "../../../core/blockchain/models/blockchain-name";
import { ProviderAddress } from "../../../core/sdk/models/provider-address";
import { DeflationTokenManager } from "../../deflation-token-manager/deflation-token-manager";
import { OnChainManagerCalculationOptions } from "./models/on-chain-manager-calculation-options";
import { OnChainTradeError } from "./models/on-chain-trade-error";
import { OnChainTypedTradeProviders } from "./models/on-chain-typed-trade-provider";
import { OnChainCalculationOptions } from "./providers/common/models/on-chain-calculation-options";
import { EvmOnChainTrade } from "./providers/common/on-chain-trade/evm-on-chain-trade/evm-on-chain-trade";
import { OnChainTrade } from "./providers/common/on-chain-trade/on-chain-trade";
import { LifiProvider } from "./providers/lifi/lifi-provider";
import { OpenOceanProvider } from "./providers/open-ocean/open-ocean-provider";
/**
 * Contains methods to calculate on-chain trades.
 */
export declare class OnChainManager {
    private readonly providerAddress;
    static readonly defaultCalculationTimeout = 20000;
    /**
     * List of all on-chain trade providers, combined by blockchains.
     */
    readonly tradeProviders: OnChainTypedTradeProviders;
    readonly lifiProvider: LifiProvider;
    readonly openOceanProvider: OpenOceanProvider;
    readonly deflationTokenManager: DeflationTokenManager;
    constructor(providerAddress: ProviderAddress);
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
    calculateTrade(fromToken: Token | {
        address: string;
        blockchain: BlockchainName;
    } | PriceToken, fromAmount: string | number, toToken: Token | string | PriceToken, options?: OnChainManagerCalculationOptions): Promise<Array<OnChainTrade | OnChainTradeError>>;
    private getFullOptions;
    private calculateTradeFromTokens;
    private isDeflationToken;
    private calculateDexes;
    private calculateLifiTrades;
    static getWrapTrade(from: PriceTokenAmount, to: PriceToken, options: OnChainCalculationOptions): [EvmOnChainTrade];
}
