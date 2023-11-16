"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultBobaProviderConfiguration = void 0;
const tokens_1 = require("../../../../../../common/tokens");
const blockchain_name_1 = require("../../../../../../core/blockchain/models/blockchain-name");
const defaultBobaRoutingProvidersAddresses = [
    tokens_1.wrappedNativeTokensList[blockchain_name_1.BLOCKCHAIN_NAME.BOBA].address,
    '0xa18bf3994c0cc6e3b63ac420308e5383f53120d7',
    '0x66a2a913e447d6b4bf33efbec43aaef87890fbbc',
    '0x5de1677344d3cb0d7d465c10b72a8f60699c062d',
    '0xf74195bb8a5cf652411867c5c2c5b8c2a402be35' // DAI
];
const defaultBobaWethAddress = tokens_1.wrappedNativeTokensList[blockchain_name_1.BLOCKCHAIN_NAME.BOBA].address;
exports.defaultBobaProviderConfiguration = {
    maxTransitTokens: 2,
    routingProvidersAddresses: defaultBobaRoutingProvidersAddresses,
    wethAddress: defaultBobaWethAddress
};
//# sourceMappingURL=default-constants.js.map