"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SushiSwapPulsechainProvider = void 0;
const blockchain_name_1 = require("../../../../../../../core/blockchain/models/blockchain-name");
const uniswap_v2_abstract_provider_1 = require("../../common/uniswap-v2-abstract/uniswap-v2-abstract-provider");
const constants_1 = require("./constants");
const sushi_swap_pulsechain_trade_1 = require("./sushi-swap-pulsechain-trade");
class SushiSwapPulsechainProvider extends uniswap_v2_abstract_provider_1.UniswapV2AbstractProvider {
    constructor() {
        super(...arguments);
        this.blockchain = blockchain_name_1.BLOCKCHAIN_NAME.PULSECHAIN;
        this.UniswapV2TradeClass = sushi_swap_pulsechain_trade_1.SushiSwapPulsechainTrade;
        this.providerSettings = constants_1.SUSHI_SWAP_PULSECHAIN_PROVIDER_CONFIGURATION;
    }
}
exports.SushiSwapPulsechainProvider = SushiSwapPulsechainProvider;
//# sourceMappingURL=sushi-swap-pulsechain-provider.js.map