"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BRIDGE_TYPE = void 0;
const cross_chain_trade_type_1 = require("../../../models/cross-chain-trade-type");
exports.DEFAULT_BRIDGE_TYPE = {
    ...cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE,
    ACROSS: 'across',
    AMAROK: 'connext',
    ANY_SWAP: 'anyswap',
    ARBITRUM_BRIDGE: 'arbitrum',
    AVALANCHE_BRIDGE: 'avalanche',
    CONNEXT: 'connext',
    CELERIM: 'celerim',
    HOP: 'hop',
    HYPHEN: 'hyphen',
    OPEN_OCEAN: 'openocean',
    MAKERS_WORMHOLE: 'maker',
    MULTICHAIN: 'multichain',
    OPTIMISM_GATEWAY: 'optimism',
    OSMOSIS_BRIDGE: 'osmosis',
    POLYGON: 'polygon',
    REFUEL: 'refuel',
    SATELLITE: 'satellite',
    STARGATE: 'stargate',
    SYMBIOSIS: 'symbiosis',
    SYNAPSE: 'synapse',
    THORCHAIN: 'thorchain',
    WORMHOLE: 'wormhole',
    YPOOL: 'ypool'
};
//# sourceMappingURL=default-bridge-type.js.map