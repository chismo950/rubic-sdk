"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DE_BRIDGE_CONTRACT_ADDRESS = void 0;
const debridge_cross_chain_supported_blockchain_1 = require("./debridge-cross-chain-supported-blockchain");
const defaultContracts = {
    providerRouter: '0x663DC15D3C1aC63ff12E45Ab68FeA3F0a883C251',
    providerGateway: '0x663DC15D3C1aC63ff12E45Ab68FeA3F0a883C251'
};
exports.DE_BRIDGE_CONTRACT_ADDRESS = debridge_cross_chain_supported_blockchain_1.deBridgeCrossChainSupportedBlockchains.reduce((acc, blockchain) => {
    return {
        ...acc,
        [blockchain]: {
            ...defaultContracts
            // rubicRouter: rubicProxyContractAddress[blockchain].gateway
        }
    };
}, {});
//# sourceMappingURL=contract-address.js.map