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
        address = '0x8D9CF7773094C97B9a2ac9E8548699ef17a86521';
    }

    if (blockchain === 'POLYGON') {
        address = '0xA7b4856D338049cDd12816D3E3d659d7bCe3C13D';
    }

    return {
        ...acc,
        [blockchain]: address
    };
}, {} as Record<MultichainProxyCrossChainSupportedBlockchain, string>);
