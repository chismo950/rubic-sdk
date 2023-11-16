"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurvePulsechainProvider = void 0;
const blockchain_name_1 = require("../../../../../../../core/blockchain/models/blockchain-name");
const curve_abstract_provider_1 = require("../../common/curve-provider/curve-abstract-provider");
const curve_ethereum_trade_1 = require("./curve-ethereum-trade");
class CurvePulsechainProvider extends curve_abstract_provider_1.CurveAbstractProvider {
    constructor() {
        super(...arguments);
        this.blockchain = blockchain_name_1.BLOCKCHAIN_NAME.PULSECHAIN;
        this.Trade = curve_ethereum_trade_1.CurvePulsechainTrade;
    }
}
exports.CurvePulsechainProvider = CurvePulsechainProvider;
//# sourceMappingURL=curve-ethereum-provider.js.map