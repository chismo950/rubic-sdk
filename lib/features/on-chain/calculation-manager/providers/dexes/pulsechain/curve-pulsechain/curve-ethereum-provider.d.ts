import { CurveAbstractProvider } from "../../common/curve-provider/curve-abstract-provider";
import { CurvePulsechainTrade } from "./curve-ethereum-trade";
export declare class CurvePulsechainProvider extends CurveAbstractProvider<CurvePulsechainTrade> {
    readonly blockchain: "PULSECHAIN";
    readonly Trade: typeof CurvePulsechainTrade;
}
