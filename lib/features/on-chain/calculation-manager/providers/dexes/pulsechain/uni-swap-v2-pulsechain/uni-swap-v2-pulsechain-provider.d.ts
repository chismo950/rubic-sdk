import { UniswapV2AbstractProvider } from "../../common/uniswap-v2-abstract/uniswap-v2-abstract-provider";
import { UniSwapV2PulsechainTrade } from "./uni-swap-v2-pulsechain-trade";
export declare class UniSwapV2PulsechainProvider extends UniswapV2AbstractProvider<UniSwapV2PulsechainTrade> {
    readonly blockchain: "PULSECHAIN";
    readonly UniswapV2TradeClass: typeof UniSwapV2PulsechainTrade;
    readonly providerSettings: import("../../common/uniswap-v2-abstract/models/uniswap-v2-provider-configuration").UniswapV2ProviderConfiguration;
}
