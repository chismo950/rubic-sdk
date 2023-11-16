"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALGEBRA_V3_PROVIDER_CONFIGURATION = void 0;
const tokens_1 = require("../../../../../../../../common/tokens");
const blockchain_name_1 = require("../../../../../../../../core/blockchain/models/blockchain-name");
exports.ALGEBRA_V3_PROVIDER_CONFIGURATION = {
    wethAddress: tokens_1.wrappedNativeTokensList[blockchain_name_1.BLOCKCHAIN_NAME.POLYGON].address,
    maxTransitTokens: 1
};
//# sourceMappingURL=provider-configuration.js.map