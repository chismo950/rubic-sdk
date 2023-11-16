import { XyQuoteRequest } from "./xy-quote-request";
export interface XySwapRequest extends XyQuoteRequest {
    receiver: string;
    srcSwapProvider: string;
}
