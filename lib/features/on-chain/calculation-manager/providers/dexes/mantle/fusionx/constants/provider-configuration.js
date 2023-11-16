"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FUSIONX_PROVIDER_CONFIGURATION = void 0;
const tokens_1 = require("../../../../../../../../common/tokens");
const blockchain_name_1 = require("../../../../../../../../core/blockchain/models/blockchain-name");
exports.FUSIONX_PROVIDER_CONFIGURATION = {
    wethAddress: tokens_1.wrappedNativeTokensList[blockchain_name_1.BLOCKCHAIN_NAME.MANTLE].address,
    maxTransitTokens: 1
};
//# sourceMappingURL=provider-configuration.js.map