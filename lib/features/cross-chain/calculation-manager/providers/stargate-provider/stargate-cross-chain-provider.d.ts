import { PriceToken, PriceTokenAmount } from "../../../../../common/tokens";
import { BlockchainName, EvmBlockchainName } from "../../../../../core/blockchain/models/blockchain-name";
import { RequiredCrossChainOptions } from "../../models/cross-chain-options";
import { CrossChainProvider } from "../common/cross-chain-provider";
import { CalculationResult } from "../common/models/calculation-result";
import { FeeInfo } from "../common/models/fee-info";
import { StargateCrossChainSupportedBlockchain } from './constants/stargate-cross-chain-supported-blockchain';
export declare class StargateCrossChainProvider extends CrossChainProvider {
    readonly type: "stargate";
    isSupportedBlockchain(blockchain: BlockchainName): blockchain is StargateCrossChainSupportedBlockchain;
    private static hasDirectRoute;
    calculate(from: PriceTokenAmount<EvmBlockchainName>, toToken: PriceToken<EvmBlockchainName>, options: RequiredCrossChainOptions): Promise<CalculationResult>;
    private getLayerZeroFee;
    protected getFeeInfo(fromBlockchain: Partial<EvmBlockchainName>, providerAddress: string, percentFeeToken: PriceTokenAmount, useProxy: boolean): Promise<FeeInfo>;
    private fetchPoolFees;
    private getPoolToken;
    private getTransitToken;
    private getDstSwap;
    static getSymbol(symbol: string, blockchain: BlockchainName): string;
}
