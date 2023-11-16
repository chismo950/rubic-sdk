"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openOceanApiUrl = void 0;
exports.openOceanApiUrl = {
    tokenList: (chain) => `https://open-api.openocean.finance/v3/${chain}/tokenList`,
    quote: (chain) => `https://open-api.openocean.finance/v3/${chain}/quote`,
    swapQuote: (chain) => `https://open-api.openocean.finance/v3/${chain}/swap_quote`
};
//# sourceMappingURL=get-open-ocean-api-url.js.map