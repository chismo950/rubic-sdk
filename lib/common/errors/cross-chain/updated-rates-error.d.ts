import { RubicSdkError } from "..";
import { EvmCrossChainTrade } from "../../../features/cross-chain/calculation-manager/providers/common/emv-cross-chain-trade/evm-cross-chain-trade";
/**
 * Thrown, when current gas price is higher, than max gas price on cross-chain contract
 * in target network.
 */
export declare class UpdatedRatesError extends RubicSdkError {
    readonly trade: EvmCrossChainTrade;
    constructor(trade: EvmCrossChainTrade);
}
