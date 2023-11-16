import { PriceToken, PriceTokenAmount } from "../../../../../common/tokens";
import { BlockchainName, EvmBlockchainName } from "../../../../../core/blockchain/models/blockchain-name";
import { RequiredCrossChainOptions } from "../../models/cross-chain-options";
import { CbridgeCrossChainSupportedBlockchain } from "./constants/cbridge-supported-blockchains";
import { CrossChainProvider } from "../common/cross-chain-provider";
import { CalculationResult } from "../common/models/calculation-result";
import { FeeInfo } from "../common/models/fee-info";
export declare class CbridgeCrossChainProvider extends CrossChainProvider {
    readonly type: "celer_bridge";
    isSupportedBlockchain(blockchain: BlockchainName): blockchain is CbridgeCrossChainSupportedBlockchain;
    calculate(fromToken: PriceTokenAmount<EvmBlockchainName>, toToken: PriceToken<EvmBlockchainName>, options: RequiredCrossChainOptions): Promise<CalculationResult>;
    private fetchContractAddressAndCheckTokens;
    private getEstimates;
    private getOnChainTrade;
    private getMinMaxAmountsErrors;
    protected getFeeInfo(fromBlockchain: CbridgeCrossChainSupportedBlockchain, providerAddress: string, percentFeeToken: PriceTokenAmount, useProxy: boolean): Promise<FeeInfo>;
}
