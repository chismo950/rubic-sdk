import { UniswapV2AbstractProvider } from "../../common/uniswap-v2-abstract/uniswap-v2-abstract-provider";
import { SushiSwapPulsechainTrade } from "./sushi-swap-pulsechain-trade";
export declare class SushiSwapPulsechainProvider extends UniswapV2AbstractProvider<SushiSwapPulsechainTrade> {
    readonly blockchain: "PULSECHAIN";
    readonly UniswapV2TradeClass: typeof SushiSwapPulsechainTrade;
    readonly providerSettings: import("../../common/uniswap-v2-abstract/models/uniswap-v2-provider-configuration").UniswapV2ProviderConfiguration;
}
