import { XyQuoteResponse } from "./xy-quote-response";
export interface XySwapResponse extends XyQuoteResponse {
    tx: {
        to: string;
        data: string;
        value: string;
    };
}
