import { BLOCKCHAIN_NAME } from 'src/core/blockchain/models/blockchain-name';

export const cbridgeSupportedBlockchains = [
    BLOCKCHAIN_NAME.BINANCE_SMART_CHAIN,
    BLOCKCHAIN_NAME.POLYGON,
    BLOCKCHAIN_NAME.AVALANCHE,
    BLOCKCHAIN_NAME.ETHEREUM,
    BLOCKCHAIN_NAME.FANTOM,
    BLOCKCHAIN_NAME.ARBITRUM,
    BLOCKCHAIN_NAME.AURORA,
    BLOCKCHAIN_NAME.OPTIMISM,
    BLOCKCHAIN_NAME.ASTAR_EVM,
    BLOCKCHAIN_NAME.BINANCE_SMART_CHAIN_TESTNET,
    BLOCKCHAIN_NAME.MUMBAI,
    BLOCKCHAIN_NAME.FUJI
] as const;

export type CbridgeCrossChainSupportedBlockchain = (typeof cbridgeSupportedBlockchains)[number];
