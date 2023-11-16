"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.web3PublicSupportedBlockchains = void 0;
const blockchain_name_1 = require("../../models/blockchain-name");
exports.web3PublicSupportedBlockchains = [
    ...Object.values(blockchain_name_1.EVM_BLOCKCHAIN_NAME),
    blockchain_name_1.BLOCKCHAIN_NAME.TRON
];
//# sourceMappingURL=web3-public-storage.js.map