"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPulsechainProviderConfiguration = void 0;
const tokens_1 = require("../../../../../../common/tokens");
const blockchain_name_1 = require("../../../../../../core/blockchain/models/blockchain-name");
const defaultPulsechainRoutingProvidersAddresses = [
    tokens_1.wrappedNativeTokensList[blockchain_name_1.BLOCKCHAIN_NAME.PULSECHAIN].address,
    '0xefD766cCb38EaF1dfd701853BFCe31359239F305',
    '0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07',
    '0x0Cb6F5a34ad42ec934882A05265A7d5F59b51A2f',
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    '0x02DcdD04e3F455D838cd1249292C58f3B79e3C3C' // WETH
];
const defaultPulsechainWethAddress = tokens_1.wrappedNativeTokensList[blockchain_name_1.BLOCKCHAIN_NAME.PULSECHAIN].address;
exports.defaultPulsechainProviderConfiguration = {
    maxTransitTokens: 2,
    routingProvidersAddresses: defaultPulsechainRoutingProvidersAddresses,
    wethAddress: defaultPulsechainWethAddress
};
//# sourceMappingURL=default-constants.js.map