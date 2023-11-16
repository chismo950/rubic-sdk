import { PriceTokenAmount, Token } from "../../../../../../../../common/tokens";
import { EvmBlockchainName } from "../../../../../../../../core/blockchain/models/blockchain-name";
import { IsDeflationToken } from "../../../../../../../deflation-token-manager/models/is-deflation-token";
import { OnChainProxyFeeInfo } from "../../../models/on-chain-proxy-fee-info";
import { GasFeeInfo } from "./gas-fee-info";
export interface EvmOnChainTradeStruct {
    from: PriceTokenAmount<EvmBlockchainName>;
    to: PriceTokenAmount<EvmBlockchainName>;
    slippageTolerance: number;
    path: ReadonlyArray<Token>;
    gasFeeInfo: GasFeeInfo | null;
    useProxy: boolean;
    proxyFeeInfo: OnChainProxyFeeInfo | undefined;
    fromWithoutFee: PriceTokenAmount<EvmBlockchainName>;
    withDeflation: {
        from: IsDeflationToken;
        to: IsDeflationToken;
    };
    usedForCrossChain?: boolean;
}
