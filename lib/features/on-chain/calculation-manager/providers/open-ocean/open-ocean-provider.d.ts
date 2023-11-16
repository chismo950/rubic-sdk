import { PriceToken, PriceTokenAmount } from "../../../../../common/tokens";
import { EvmBlockchainName } from "../../../../../core/blockchain/models/blockchain-name";
import { OnChainTradeError } from "../../models/on-chain-trade-error";
import { RequiredOnChainCalculationOptions } from "../common/models/on-chain-calculation-options";
import { OnChainProxyFeeInfo } from "../common/models/on-chain-proxy-fee-info";
import { OnChainTrade } from "../common/on-chain-trade/on-chain-trade";
export declare class OpenOceanProvider {
    private readonly onChainProxyService;
    static readonly nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    constructor();
    calculate(from: PriceTokenAmount<EvmBlockchainName>, toToken: PriceToken<EvmBlockchainName>, options: RequiredOnChainCalculationOptions): Promise<OnChainTrade | OnChainTradeError>;
    protected handleProxyContract(from: PriceTokenAmount<EvmBlockchainName>, fullOptions: RequiredOnChainCalculationOptions): Promise<{
        fromWithoutFee: PriceTokenAmount<EvmBlockchainName>;
        proxyFeeInfo: OnChainProxyFeeInfo | undefined;
    }>;
    private getGasFeeInfo;
    private checkIsSupportedBlockchain;
    private checkIsSupportedTokens;
}
