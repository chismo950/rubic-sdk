export declare const CROSS_CHAIN_TRADE_TYPE: {
    readonly SYMBIOSIS: "symbiosis";
    readonly LIFI: "lifi";
    readonly DEBRIDGE: "dln";
    readonly BRIDGERS: "bridgers";
    readonly MULTICHAIN: "multichain";
    readonly XY: "xy";
    readonly CELER_BRIDGE: "celer_bridge";
    readonly CHANGENOW: "changenow";
    readonly STARGATE: "stargate";
    readonly ARBITRUM: "arbitrum";
    readonly SQUIDROUTER: "squidrouter";
    readonly SCROLL_BRIDGE: "scroll_bridge";
    readonly TAIKO_BRIDGE: "taiko_bridge";
};
export type CrossChainTradeType = (typeof CROSS_CHAIN_TRADE_TYPE)[keyof typeof CROSS_CHAIN_TRADE_TYPE];
