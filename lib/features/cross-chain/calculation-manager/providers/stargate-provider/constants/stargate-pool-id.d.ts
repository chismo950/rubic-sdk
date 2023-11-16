import { StargateBridgeToken } from "./stargate-bridge-token";
declare const pools: {
    readonly USDC: 1;
    readonly USDT: 2;
    readonly DAI: 3;
    readonly BUSD: 5;
    readonly FRAX: 7;
    readonly USDD: 11;
    readonly sUSD: 14;
    readonly LUSD: 15;
    readonly MAI: 16;
    readonly METIS: 17;
    readonly "m.USDT": 19;
    readonly ETH: 13;
    readonly WETH: 13;
    readonly AETH: 13;
    readonly SGETH: 13;
    readonly FUSDC: 21;
};
export declare const stargatePoolId: Record<StargateBridgeToken, number>;
export type StargatePoolId = (typeof pools)[keyof typeof pools];
export {};