import { RubicSdkError } from 'src/common/errors';
import { EvmOnChainTrade } from 'src/features/on-chain/calculation-manager/providers/common/on-chain-trade/evm-on-chain-trade/evm-on-chain-trade';

/**
 * Thrown, when current gas price is higher, than max gas price on cross-chain contract
 * in target network.
 */
export class UpdatedRatesOnChainError extends RubicSdkError {
    constructor(public readonly trade: EvmOnChainTrade) {
        super();
        Object.setPrototypeOf(this, UpdatedRatesOnChainError.prototype);
    }
}
