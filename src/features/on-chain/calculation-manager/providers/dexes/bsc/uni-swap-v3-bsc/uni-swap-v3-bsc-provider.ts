import { BLOCKCHAIN_NAME } from 'src/core/blockchain/models/blockchain-name';
import { UNI_SWAP_V3_BSC_PROVIDER_CONFIGURATION } from 'src/features/on-chain/calculation-manager/providers/dexes/bsc/uni-swap-v3-bsc/constants/provider-configuration';
import { UNI_SWAP_V3_BSC_ROUTER_CONFIGURATION } from 'src/features/on-chain/calculation-manager/providers/dexes/bsc/uni-swap-v3-bsc/constants/router-configuration';
import { UniSwapV3BscTrade } from 'src/features/on-chain/calculation-manager/providers/dexes/bsc/uni-swap-v3-bsc/uni-swap-v3-bsc-trade';
import { UniswapV3AbstractProvider } from 'src/features/on-chain/calculation-manager/providers/dexes/common/uniswap-v3-abstract/uniswap-v3-abstract-provider';

export class UniSwapV3BscProvider extends UniswapV3AbstractProvider<UniSwapV3BscTrade> {
    public readonly blockchain = BLOCKCHAIN_NAME.BINANCE_SMART_CHAIN;

    public readonly OnChainTradeClass = UniSwapV3BscTrade;

    public readonly providerConfiguration = UNI_SWAP_V3_BSC_PROVIDER_CONFIGURATION;

    public readonly routerConfiguration = UNI_SWAP_V3_BSC_ROUTER_CONFIGURATION;
}
