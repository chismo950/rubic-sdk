import { PriceToken, PriceTokenAmount } from "../../../../../common/tokens";
import { EvmBlockchainName } from "../../../../../core/blockchain/models/blockchain-name";
import { RequiredOnChainCalculationOptions } from "../common/models/on-chain-calculation-options";
import { OnChainProxyFeeInfo } from "../common/models/on-chain-proxy-fee-info";
import { OnChainTrade } from "../common/on-chain-trade/on-chain-trade";
import { LifiCalculationOptions } from "./models/lifi-calculation-options";
export declare class LifiProvider {
    private readonly lifi;
    private readonly onChainProxyService;
    private readonly defaultOptions;
    constructor();
    private isForbiddenBlockchain;
    calculate(from: PriceTokenAmount<EvmBlockchainName>, toToken: PriceToken<EvmBlockchainName>, options: LifiCalculationOptions): Promise<OnChainTrade[]>;
    protected handleProxyContract(from: PriceTokenAmount<EvmBlockchainName>, fullOptions: RequiredOnChainCalculationOptions): Promise<{
        fromWithoutFee: PriceTokenAmount<EvmBlockchainName>;
        proxyFeeInfo: OnChainProxyFeeInfo | undefined;
    }>;
    private getGasFeeInfo;
    private getPath;
}
