import { XyQuoteRequest } from "./xy-quote-request";
interface XyRoute extends XyQuoteRequest {
    srcSwapDescription: {
        provider: string;
    };
    dstQuoteTokenAmount: string;
    minReceiveAmount: string;
    affiliateFeeAmount: string;
    withholdingFeeAmount: string;
    routeType: string;
    tags: unknown[];
    contractAddress: string;
    srcQuoteTokenUsdValue: string;
    dstQuoteTokenUsdValue: string;
    transactionCounts: number;
    estimatedGas: string;
    estimatedTransferTime: number;
}
export interface XyQuoteResponse {
    success: boolean;
    routes: XyRoute[];
}
export {};
