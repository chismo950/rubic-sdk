import BigNumber from 'bignumber.js';
import { FeeInfo } from "./fee-info";
export interface TradeInfo {
    estimatedGas: BigNumber | null;
    feeInfo: FeeInfo;
    priceImpact: number | null;
    slippage: number;
}
