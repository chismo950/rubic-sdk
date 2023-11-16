import { PriceTokenAmount } from "../../../../../../common/tokens";
import { BlockchainName, EvmBlockchainName } from "../../../../../../core/blockchain/models/blockchain-name";
import { ProxySupportedBlockchain } from "../../../../../common/constants/proxy-supported-blockchain";
import { OnChainProxyFeeInfo } from "../models/on-chain-proxy-fee-info";
export declare class OnChainProxyService {
    static isSupportedBlockchain(blockchain: BlockchainName): blockchain is ProxySupportedBlockchain;
    getFeeInfo(from: PriceTokenAmount<EvmBlockchainName>, providerAddress: string): Promise<OnChainProxyFeeInfo>;
    private static handleIntegratorFee;
    private static handleRubicFee;
}
