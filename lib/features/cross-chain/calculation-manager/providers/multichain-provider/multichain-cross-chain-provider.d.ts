import { PriceToken, PriceTokenAmount } from "../../../../../common/tokens";
import { BlockchainName, EvmBlockchainName } from "../../../../../core/blockchain/models/blockchain-name";
import { RequiredCrossChainOptions } from "../../models/cross-chain-options";
import { CrossChainProvider } from "../common/cross-chain-provider";
import { CalculationResult } from "../common/models/calculation-result";
import { FeeInfo } from "../common/models/fee-info";
import { MultichainCrossChainSupportedBlockchain } from "./models/supported-blockchain";
export declare class MultichainCrossChainProvider extends CrossChainProvider {
    readonly type: "multichain";
    isSupportedBlockchain(blockchain: BlockchainName): blockchain is MultichainCrossChainSupportedBlockchain;
    calculate(from: PriceTokenAmount<EvmBlockchainName>, toToken: PriceToken, options: RequiredCrossChainOptions): Promise<CalculationResult>;
    private getProtocolFee;
    protected getFeeInfo(fromBlockchain: MultichainCrossChainSupportedBlockchain, providerAddress: string, percentFeeToken: PriceTokenAmount, useProxy: boolean): Promise<FeeInfo>;
    private checkMinMaxErrors;
    private getToFeeAmount;
    private isMultichainMethodName;
    private getTokensData;
    private checkIsBridge;
}
