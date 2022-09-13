import { EvmBlockchainName, TronBlockchainName } from 'src/core/blockchain/models/blockchain-name';
import { EvmWeb3Public } from 'src/core/blockchain/web3-public-service/web3-public/evm-web3-public/evm-web3-public';
import { TronWeb3Public } from 'src/core/blockchain/web3-public-service/web3-public/tron-web3-public/tron-web3-public';

export type Web3PublicStorage = Partial<Record<EvmBlockchainName, EvmWeb3Public>> &
    Record<TronBlockchainName, TronWeb3Public>;

export type Web3PublicSupportedBlockchainName = EvmBlockchainName | TronBlockchainName;
