import { OnChainCalculationOptions, RequiredOnChainCalculationOptions } from "../../common/models/on-chain-calculation-options";
import { OnChainTradeType } from "../../common/models/on-chain-trade-type";
import { MarkRequired } from 'ts-essentials';
export type LifiCalculationOptions = OnChainCalculationOptions & {
    readonly gasCalculation?: 'disabled' | 'calculate';
    readonly disabledProviders: OnChainTradeType[];
};
export type RequiredLifiCalculationOptions = MarkRequired<RequiredOnChainCalculationOptions & LifiCalculationOptions, 'gasCalculation'>;
