import { XyEstimationRequest } from "./xy-estimation-request";
/**
 * Transaction request params.
 */
export interface XyTransactionRequest extends XyEstimationRequest {
    /**
     * Tokens receiver address.
     */
    readonly receiveAddress: string;
    /**
     * Swap slippage tolerance.
     */
    readonly slippage: string;
    /**
     * Ref address to support stuck transactions.
     */
    readonly referrer: string;
}
