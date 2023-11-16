"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultKlaytnProviderConfiguration = void 0;
const tokens_1 = require("../../../../../../common/tokens");
const blockchain_name_1 = require("../../../../../../core/blockchain/models/blockchain-name");
const defaultKlaytnRoutingProvidersAddresses = [
    tokens_1.wrappedNativeTokensList[blockchain_name_1.BLOCKCHAIN_NAME.KLAYTN].address // WKLAYTN
];
const defaultKlaytnWethAddress = tokens_1.wrappedNativeTokensList[blockchain_name_1.BLOCKCHAIN_NAME.KLAYTN].address;
exports.defaultKlaytnProviderConfiguration = {
    maxTransitTokens: 2,
    routingProvidersAddresses: defaultKlaytnRoutingProvidersAddresses,
    wethAddress: defaultKlaytnWethAddress
};
//# sourceMappingURL=default-constants.js.map