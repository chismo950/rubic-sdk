export declare const stargateBridgeToken: {
    readonly USDC: "USDC";
    readonly USDT: "USDT";
    readonly DAI: "DAI";
    readonly MAI: "MAI";
    readonly FRAX: "FRAX";
    readonly USDD: "USDD";
    readonly sUSD: "sUSD";
    readonly LUSD: "LUSD";
    readonly BUSD: "BUSD";
    readonly mUSD: "m.USDT";
    readonly METIS: "METIS";
    readonly ETH: "ETH";
    readonly WETH: "WETH";
    readonly SGETH: "SGETH";
    readonly AETH: "AETH";
    readonly FUSDC: "FUSDC";
};
export type StargateBridgeToken = (typeof stargateBridgeToken)[keyof typeof stargateBridgeToken];
