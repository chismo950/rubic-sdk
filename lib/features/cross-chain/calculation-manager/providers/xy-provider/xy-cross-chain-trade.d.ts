import BigNumber from 'bignumber.js';
import { BytesLike } from 'ethers';
import { PriceTokenAmount } from "../../../../../common/tokens";
import { EvmBlockchainName } from "../../../../../core/blockchain/models/blockchain-name";
import { ContractParams } from "../../../../common/models/contract-params";
import { SwapTransactionOptions } from "../../../../common/models/swap-transaction-options";
import { EvmCrossChainTrade } from "../common/emv-cross-chain-trade/evm-cross-chain-trade";
import { GasData } from "../common/emv-cross-chain-trade/models/gas-data";
import { FeeInfo } from "../common/models/fee-info";
import { GetContractParamsOptions } from "../common/models/get-contract-params-options";
import { TradeInfo } from "../common/models/trade-info";
import { XyTransactionRequest } from "./models/xy-transaction-request";
import { EvmOnChainTrade } from "../../../../on-chain/calculation-manager/providers/common/on-chain-trade/evm-on-chain-trade/evm-on-chain-trade";
/**
 * Calculated XY cross-chain trade.
 */
export declare class XyCrossChainTrade extends EvmCrossChainTrade {
    /** @internal */
    static getGasData(from: PriceTokenAmount<EvmBlockchainName>, to: PriceTokenAmount<EvmBlockchainName>, transactionRequest: XyTransactionRequest): Promise<GasData | null>;
    static readonly nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    readonly type: "xy";
    readonly isAggregator = false;
    readonly onChainSubtype: {
        from: undefined;
        to: undefined;
    };
    readonly bridgeType: "xy";
    readonly from: PriceTokenAmount<EvmBlockchainName>;
    readonly to: PriceTokenAmount<EvmBlockchainName>;
    readonly toTokenAmountMin: BigNumber;
    readonly priceImpact: number | null;
    readonly gasData: GasData | null;
    private readonly transactionRequest;
    private get fromBlockchain();
    protected get fromContractAddress(): string;
    readonly feeInfo: FeeInfo;
    private readonly slippage;
    protected get methodName(): string;
    private readonly onChainTrade;
    constructor(crossChainTrade: {
        from: PriceTokenAmount<EvmBlockchainName>;
        to: PriceTokenAmount<EvmBlockchainName>;
        transactionRequest: XyTransactionRequest;
        gasData: GasData | null;
        priceImpact: number | null;
        slippage: number;
        feeInfo: FeeInfo;
        onChainTrade: EvmOnChainTrade | null;
    }, providerAddress: string);
    protected swapDirect(options?: SwapTransactionOptions): Promise<string | never>;
    getContractParams(options: GetContractParamsOptions): Promise<ContractParams>;
    getTradeAmountRatio(fromUsd: BigNumber): BigNumber;
    private getTransactionRequest;
    getUsdPrice(): BigNumber;
    getTradeInfo(): TradeInfo;
    protected getProviderData(_sourceData: BytesLike): unknown[];
    private checkOrderAmount;
}
