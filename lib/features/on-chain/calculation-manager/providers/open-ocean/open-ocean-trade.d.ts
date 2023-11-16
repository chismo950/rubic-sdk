import BigNumber from 'bignumber.js';
import { PriceTokenAmount } from "../../../../../common/tokens/price-token-amount";
import { EvmEncodeConfig } from "../../../../../core/blockchain/web3-pure/typed-web3-pure/evm-web3-pure/models/evm-encode-config";
import { EncodeTransactionOptions } from "../../../../common/models/encode-transaction-options";
import { EvmOnChainTrade } from "../common/on-chain-trade/evm-on-chain-trade/evm-on-chain-trade";
import { OpenOceanTradeStruct } from "./models/open-ocean-trade-struct";
export declare class OpenOceanTrade extends EvmOnChainTrade {
    /** @internal */
    static getGasLimit(openOceanTradeStruct: OpenOceanTradeStruct): Promise<BigNumber | null>;
    readonly type: "OPEN_OCEAN";
    private readonly _toTokenAmountMin;
    static readonly nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    protected get spenderAddress(): string;
    get dexContractAddress(): string;
    get toTokenAmountMin(): PriceTokenAmount;
    constructor(tradeStruct: OpenOceanTradeStruct, providerAddress: string);
    encodeDirect(options: EncodeTransactionOptions): Promise<EvmEncodeConfig>;
    private getTransactionData;
}
