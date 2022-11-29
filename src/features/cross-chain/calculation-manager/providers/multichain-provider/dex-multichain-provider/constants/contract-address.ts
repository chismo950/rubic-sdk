import {
    MultichainProxyCrossChainSupportedBlockchain,
    multichainProxyCrossChainSupportedBlockchains
} from 'src/features/cross-chain/calculation-manager/providers/multichain-provider/dex-multichain-provider/models/supported-blockchain';

export const multichainProxyContractAddress: Record<
    MultichainProxyCrossChainSupportedBlockchain,
    string
> = multichainProxyCrossChainSupportedBlockchains.reduce((acc, blockchain) => {
    let address = '0x333BE852042F435431967664e09315CC63593333';

    if (blockchain === 'BSC') {
        address = '0x1ba65dc9d69ad2d941326f218b5f4db5ce79db5e';
    }

    if (blockchain === 'POLYGON') {
        address = '0xd9934a09f25ead90aa83726861d6f1394a2cca9a';
    }

    return {
        ...acc,
        [blockchain]: address
    };
}, {} as Record<MultichainProxyCrossChainSupportedBlockchain, string>);
