import { wrappedNativeTokensList } from 'src/common/tokens';
import { BLOCKCHAIN_NAME } from 'src/core/blockchain/models/blockchain-name';
import {
    UniswapV3RouterConfiguration,
    UniswapV3RouterLiquidityPool
} from 'src/features/on-chain/calculation-manager/providers/dexes/common/uniswap-v3-abstract/models/uniswap-v3-router-configuration';

/**
 * Most popular tokens in uni v3 to use in a route.
 */
const tokensSymbols = ['WBNB', 'USDT', 'USDC', 'BUSD', 'BTCB'] as const;

type TokenSymbol = (typeof tokensSymbols)[number];

const routerTokens: Record<TokenSymbol, string> = {
    WBNB: wrappedNativeTokensList[BLOCKCHAIN_NAME.BINANCE_SMART_CHAIN]!.address,
    USDT: '0x55d398326f99059ff775485246999027b3197955',
    USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c'
};

const routerLiquidityPools: UniswapV3RouterLiquidityPool<TokenSymbol>[] = [
    {
        poolAddress: '0x28df0835942396b7a1b7ae1cd068728e6ddbbafd',
        tokenSymbolA: 'BTCB',
        tokenSymbolB: 'WBNB',
        fee: 500
    },
    {
        poolAddress: '0x32776ed4d96ed069a2d812773f0ad8ad9ef83cf8',
        tokenSymbolA: 'WBNB',
        tokenSymbolB: 'BUSD',
        fee: 3000
    },
    {
        poolAddress: '0x7862d9b4be2156b15d54f41ee4ede2d5b0b455e4',
        tokenSymbolA: 'USDT',
        tokenSymbolB: 'WBNB',
        fee: 3000
    },
    {
        poolAddress: '0x6bcb0ba386e9de0c29006e46b2f01f047ca1806e',
        tokenSymbolA: 'USDC',
        tokenSymbolB: 'WBNB',
        fee: 3000
    },
    {
        poolAddress: '0x84e47c7f2fe86f6b5efbe14fee46b8bb871b2e05',
        tokenSymbolA: 'USDT',
        tokenSymbolB: 'BUSD',
        fee: 500
    },
    {
        poolAddress: '0xccdfcd1aac447d5b29980f64b831c532a6a33726',
        tokenSymbolA: 'USDT',
        tokenSymbolB: 'USDC',
        fee: 500
    }
];

export const UNI_SWAP_V3_BSC_ROUTER_CONFIGURATION: UniswapV3RouterConfiguration<TokenSymbol> = {
    tokens: routerTokens,
    liquidityPools: routerLiquidityPools
};
