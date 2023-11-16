import BigNumber from 'bignumber.js';
import { RubicSdkError } from "../../../../../common/errors";
import { PriceToken, PriceTokenAmount } from "../../../../../common/tokens";
import { BlockchainName } from "../../../../../core/blockchain/models/blockchain-name";
import { Web3PrivateSupportedBlockchain } from "../../../../../core/blockchain/web3-private-service/models/web-private-supported-blockchain";
import { Web3PublicSupportedBlockchain } from "../../../../../core/blockchain/web3-public-service/models/web3-public-storage";
import { HttpClient } from "../../../../../core/http-client/models/http-client";
import { RequiredCrossChainOptions } from "../../models/cross-chain-options";
import { CrossChainTradeType } from "../../models/cross-chain-trade-type";
import { CalculationResult } from "./models/calculation-result";
import { FeeInfo } from "./models/fee-info";
import { AbiItem } from 'web3-utils';
export declare abstract class CrossChainProvider {
    static parseError(err: unknown): RubicSdkError;
    abstract readonly type: CrossChainTradeType;
    protected get httpClient(): HttpClient;
    abstract isSupportedBlockchain(fromBlockchain: BlockchainName): boolean;
    areSupportedBlockchains(fromBlockchain: BlockchainName, toBlockchain: BlockchainName): boolean;
    abstract calculate(from: PriceTokenAmount, toToken: PriceToken, options: RequiredCrossChainOptions): Promise<CalculationResult>;
    protected getWalletAddress(blockchain: Web3PrivateSupportedBlockchain): string;
    /**
     * Gets fee information.
     * @param _fromBlockchain Source network blockchain.
     * @param _providerAddress Integrator address.
     * @param _percentFeeToken Protocol fee token.
     * @param _useProxy Use rubic proxy or not.
     * @param _contractAbi Rubic Proxy contract abi.
     * @protected
     * @internal
     */
    protected getFeeInfo(_fromBlockchain: Partial<BlockchainName>, _providerAddress: string, _percentFeeToken: PriceToken, _useProxy: boolean, _contractAbi?: AbiItem[]): Promise<FeeInfo>;
    /**
     * Gets fixed fee information.
     * @param fromBlockchain Source network blockchain.
     * @param providerAddress Integrator address.
     * @param contractAddress Contract address.
     * @param contractAbi Contract ABI.
     * @protected
     * @internal
     */
    protected getFixedFee(fromBlockchain: Web3PublicSupportedBlockchain, providerAddress: string, contractAddress: string, contractAbi: AbiItem[]): Promise<BigNumber>;
    /**
     * Gets percent fee.
     * @param fromBlockchain Source network blockchain.
     * @param providerAddress Integrator address.
     * @param contractAddress Contract address.
     * @param contractAbi Contract ABI.
     * @protected
     * @internal
     */
    protected getFeePercent(fromBlockchain: Web3PublicSupportedBlockchain, providerAddress: string, contractAddress: string, contractAbi: AbiItem[]): Promise<number>;
    protected checkContractState(fromBlockchain: Web3PublicSupportedBlockchain, rubicRouter: string, contractAbi: AbiItem[]): Promise<void>;
}
