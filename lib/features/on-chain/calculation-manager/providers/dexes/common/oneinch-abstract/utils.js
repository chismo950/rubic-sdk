"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oneInchHttpGetRequest = void 0;
const blockchain_id_1 = require("../../../../../../../core/blockchain/utils/blockchains-info/constants/blockchain-id");
const injector_1 = require("../../../../../../../core/injector/injector");
function oneInchHttpGetRequest(path, blockchain, options) {
    return injector_1.Injector.httpClient.get(`https://x-api.rubic.exchange/api/swap/v5.2/${blockchain_id_1.blockchainId[blockchain]}/${path}`, {
        ...options
    });
}
exports.oneInchHttpGetRequest = oneInchHttpGetRequest;
//# sourceMappingURL=utils.js.map