"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareCrossChainTrades = void 0;
const errors_1 = require("../../../../common/errors");
/**
 * Compares two cross chain trades for sorting algorithm.
 */
function compareCrossChainTrades(nextWrappedTrade, prevWrappedTrade) {
    if (prevWrappedTrade?.error instanceof errors_1.MinAmountError &&
        nextWrappedTrade?.error instanceof errors_1.MinAmountError) {
        return prevWrappedTrade.error.minAmount.lte(nextWrappedTrade.error.minAmount) ? 1 : -1;
    }
    if (prevWrappedTrade?.error instanceof errors_1.MaxAmountError &&
        nextWrappedTrade?.error instanceof errors_1.MaxAmountError) {
        return prevWrappedTrade.error.maxAmount.gte(nextWrappedTrade.error.maxAmount) ? 1 : -1;
    }
    if (!prevWrappedTrade || !prevWrappedTrade?.trade || prevWrappedTrade.error) {
        if (nextWrappedTrade?.trade ||
            nextWrappedTrade?.error instanceof errors_1.MinAmountError ||
            nextWrappedTrade?.error instanceof errors_1.MaxAmountError) {
            return -1;
        }
        return 1;
    }
    if (!nextWrappedTrade ||
        nextWrappedTrade.error ||
        nextWrappedTrade?.trade?.to?.tokenAmount.lte(0)) {
        return 1;
    }
    const fromUsd = prevWrappedTrade.trade.getUsdPrice();
    const prevTradeRatio = prevWrappedTrade?.trade?.getTradeAmountRatio(fromUsd);
    const nextTradeRatio = nextWrappedTrade?.trade?.getTradeAmountRatio(fromUsd);
    if (!nextTradeRatio) {
        return 1;
    }
    if (!prevTradeRatio) {
        return -1;
    }
    return prevTradeRatio.lte(nextTradeRatio) ? 1 : -1;
}
exports.compareCrossChainTrades = compareCrossChainTrades;
//# sourceMappingURL=compare-cross-chain-trades.js.map