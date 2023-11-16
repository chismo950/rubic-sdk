"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNI_SWAP_V3_SCROLL_SEPOLIA_PROVIDER_CONFIGURATION = void 0;
const tokens_1 = require("../../../../../../../../common/tokens");
const blockchain_name_1 = require("../../../../../../../../core/blockchain/models/blockchain-name");
exports.UNI_SWAP_V3_SCROLL_SEPOLIA_PROVIDER_CONFIGURATION = {
    wethAddress: tokens_1.wrappedNativeTokensList[blockchain_name_1.BLOCKCHAIN_NAME.SCROLL_SEPOLIA].address,
    maxTransitTokens: 1
};
//# sourceMappingURL=provider-configuration.js.map