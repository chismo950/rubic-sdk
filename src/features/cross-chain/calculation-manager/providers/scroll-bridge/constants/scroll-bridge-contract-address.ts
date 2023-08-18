import { BLOCKCHAIN_NAME } from 'src/core/blockchain/models/blockchain-name';
import { UniversalContract } from 'src/features/cross-chain/calculation-manager/providers/common/models/universal-contract';
import { ScrollBridgeSupportedBlockchain } from 'src/features/cross-chain/calculation-manager/providers/scroll-bridge/models/scroll-bridge-supported-blockchain';

export const scrollBridgeContractAddress: Record<
    ScrollBridgeSupportedBlockchain,
    UniversalContract
> = {
    [BLOCKCHAIN_NAME.SCROLL_SEPOLIA]: {
        providerGateway: '0xaDcA915971A336EA2f5b567e662F5bd74AEf9582',
        providerRouter: '0xaDcA915971A336EA2f5b567e662F5bd74AEf9582',
        rubicRouter: '0x33798753ec66aEc00ed7E337B41F444f53A63333'
    },
    [BLOCKCHAIN_NAME.SEPOLIA]: {
        providerGateway: '0x65D123d6389b900d954677c26327bfc1C3e88A13',
        providerRouter: '0x65D123d6389b900d954677c26327bfc1C3e88A13',
        rubicRouter: '0x33798753ec66aEc00ed7E337B41F444f53A63333'
    }
};
