"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniSwapV2PulsechainTrade = void 0;
const on_chain_trade_type_1 = require("../../../common/models/on-chain-trade-type");
const uniswap_v2_abstract_trade_1 = require("../../common/uniswap-v2-abstract/uniswap-v2-abstract-trade");
const constants_1 = require("./constants");
class UniSwapV2PulsechainTrade extends uniswap_v2_abstract_trade_1.UniswapV2AbstractTrade {
    constructor() {
        super(...arguments);
        this.dexContractAddress = constants_1.UNISWAP_V2_PULSECHAIN_CONTRACT_ADDRESS;
    }
    static get type() {
        return on_chain_trade_type_1.ON_CHAIN_TRADE_TYPE.UNISWAP_V2;
    }
}
exports.UniSwapV2PulsechainTrade = UniSwapV2PulsechainTrade;
//# sourceMappingURL=uni-swap-v2-pulsechain-trade.js.map