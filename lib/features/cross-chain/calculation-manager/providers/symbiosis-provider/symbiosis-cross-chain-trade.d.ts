import BigNumber from 'bignumber.js';
import { PriceTokenAmount } from "../../../../../common/tokens";
import { EvmBlockchainName } from "../../../../../core/blockchain/models/blockchain-name";
import { EvmWeb3Private } from "../../../../../core/blockchain/web3-private-service/web3-private/evm-web3-private/evm-web3-private";
import { ContractParams } from "../../../../common/models/contract-params";
import { SwapTransactionOptions } from "../../../../common/models/swap-transaction-options";
import { EvmCrossChainTrade } from "../common/emv-cross-chain-trade/evm-cross-chain-trade";
import { GasData } from "../common/emv-cross-chain-trade/models/gas-data";
import { FeeInfo } from "../common/models/fee-info";
import { GetContractParamsOptions } from "../common/models/get-contract-params-options";
import { OnChainSubtype } from "../common/models/on-chain-subtype";
import { TradeInfo } from "../common/models/trade-info";
import { SymbiosisTradeData, SymbiosisTradeType } from "./models/symbiosis-trade-data";
/**
 * Calculated Symbiosis cross-chain trade.
 */
export declare class SymbiosisCrossChainTrade extends EvmCrossChainTrade {
    /** @internal */
    static getGasData(from: PriceTokenAmount<EvmBlockchainName>, to: PriceTokenAmount): Promise<GasData | null>;
    readonly type: "symbiosis";
    readonly isAggregator = false;
    readonly onChainSubtype: OnChainSubtype;
    readonly bridgeType: "symbiosis";
    readonly from: PriceTokenAmount<EvmBlockchainName>;
    readonly to: PriceTokenAmount;
    readonly toTokenAmountMin: BigNumber;
    /** @internal */
    readonly transitAmount: BigNumber;
    readonly amountInUsd: BigNumber | null;
    readonly feeInfo: FeeInfo;
    /**
     * Overall price impact, fetched from symbiosis api.
     */
    readonly priceImpact: number | null;
    readonly gasData: GasData | null;
    private readonly slippage;
    private readonly contractAddresses;
    private readonly getTransactionRequest;
    private get fromBlockchain();
    protected get fromContractAddress(): string;
    protected get methodName(): string;
    private get tronWeb3Public();
    protected get evmWeb3Private(): EvmWeb3Private;
    constructor(crossChainTrade: {
        from: PriceTokenAmount<EvmBlockchainName>;
        to: PriceTokenAmount;
        swapFunction: (fromAddress: string, receiver?: string) => Promise<SymbiosisTradeData>;
        gasData: GasData | null;
        priceImpact: number | null;
        slippage: number;
        feeInfo: FeeInfo;
        transitAmount: BigNumber;
        amountInUsd: BigNumber | null;
        tradeType: {
            in?: SymbiosisTradeType;
            out?: SymbiosisTradeType;
        };
        contractAddresses: {
            providerRouter: string;
            providerGateway: string;
        };
    }, providerAddress: string);
    protected getContractParams(options: GetContractParamsOptions): Promise<ContractParams>;
    /**
     * Used for direct provider swaps.
     * @param options Swap options
     */
    protected swapDirect(options?: SwapTransactionOptions): Promise<string | never>;
    getTradeAmountRatio(fromUsd: BigNumber): BigNumber;
    getUsdPrice(): BigNumber;
    getTradeInfo(): TradeInfo;
    private static getSubtype;
}
