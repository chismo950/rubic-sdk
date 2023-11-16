import BigNumber from 'bignumber.js';
import { PriceTokenAmount } from "../../../../../common/tokens/price-token-amount";
import { EvmEncodeConfig } from "../../../../../core/blockchain/web3-pure/typed-web3-pure/evm-web3-pure/models/evm-encode-config";
import { EncodeTransactionOptions } from "../../../../common/models/encode-transaction-options";
import { OnChainTradeType } from "../common/models/on-chain-trade-type";
import { EvmOnChainTrade } from "../common/on-chain-trade/evm-on-chain-trade/evm-on-chain-trade";
import { LifiTradeStruct } from "./models/lifi-trade-struct";
export declare class LifiTrade extends EvmOnChainTrade {
    /** @internal */
    static getGasLimit(lifiTradeStruct: LifiTradeStruct): Promise<BigNumber | null>;
    readonly providerGateway: string;
    readonly type: OnChainTradeType;
    private readonly route;
    private readonly _toTokenAmountMin;
    protected get spenderAddress(): string;
    get dexContractAddress(): string;
    get toTokenAmountMin(): PriceTokenAmount;
    constructor(tradeStruct: LifiTradeStruct, providerAddress: string);
    encodeDirect(options: EncodeTransactionOptions): Promise<EvmEncodeConfig>;
    private getTransactionData;
}
