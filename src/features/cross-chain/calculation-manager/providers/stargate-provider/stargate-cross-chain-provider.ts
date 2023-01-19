import BigNumber from 'bignumber.js';
import { RubicSdkError } from 'src/common/errors';
import { PriceToken, PriceTokenAmount } from 'src/common/tokens';
import { nativeTokensList } from 'src/common/tokens/constants/native-tokens';
import { parseError } from 'src/common/utils/errors';
import { BlockchainName, EvmBlockchainName } from 'src/core/blockchain/models/blockchain-name';
import { CHAIN_TYPE } from 'src/core/blockchain/models/chain-type';
import { EvmWeb3Pure } from 'src/core/blockchain/web3-pure/typed-web3-pure/evm-web3-pure/evm-web3-pure';
import { Web3Pure } from 'src/core/blockchain/web3-pure/web3-pure';
import { Injector } from 'src/core/injector/injector';
import { RequiredCrossChainOptions } from 'src/features/cross-chain/calculation-manager/models/cross-chain-options';
import { CROSS_CHAIN_TRADE_TYPE } from 'src/features/cross-chain/calculation-manager/models/cross-chain-trade-type';
import { CrossChainProvider } from 'src/features/cross-chain/calculation-manager/providers/common/cross-chain-provider';
import { evmCommonCrossChainAbi } from 'src/features/cross-chain/calculation-manager/providers/common/emv-cross-chain-trade/constants/evm-common-cross-chain-abi';
import { CalculationResult } from 'src/features/cross-chain/calculation-manager/providers/common/models/calculation-result';
import { FeeInfo } from 'src/features/cross-chain/calculation-manager/providers/common/models/fee-info';
import { RANGO_CONTRACT_ADDRESSES } from 'src/features/cross-chain/calculation-manager/providers/rango-provider/constants/contract-address';
import { RangoCrossChainSupportedBlockchain } from 'src/features/cross-chain/calculation-manager/providers/rango-provider/constants/rango-cross-chain-supported-blockchain';

import { stargateBlockchainSupportedPools } from './constants/stargate-blockchain-supported-pool';
import { stargateChainId } from './constants/stargate-chain-id';
import { stargateContractAddress } from './constants/stargate-contract-address';
import {
    StargateCrossChainSupportedBlockchain,
    stargateCrossChainSupportedBlockchains
} from './constants/stargate-cross-chain-supported-blockchain';
import { StargateBridgeToken, stargatePoolId } from './constants/stargate-pool-id';
import { stargateRouterAbi } from './constants/stargate-router-abi';
import { StargateCrossChainTrade } from './stargate-cross-chain-trade';

export class StargateCrossChainProvider extends CrossChainProvider {
    public readonly type = CROSS_CHAIN_TRADE_TYPE.STARGATE;

    private feeInfo: FeeInfo = {};

    public isSupportedBlockchain(
        blockchain: BlockchainName
    ): blockchain is StargateCrossChainSupportedBlockchain {
        return stargateCrossChainSupportedBlockchains.some(
            supportedBlockchain => supportedBlockchain === blockchain
        );
    }

    private checkIsSupportedTokens(
        from: PriceTokenAmount<EvmBlockchainName>,
        to: PriceToken<EvmBlockchainName>
    ): void {
        const fromBlockchain = from.blockchain as StargateCrossChainSupportedBlockchain;
        const toBlockchain = to.blockchain as StargateCrossChainSupportedBlockchain;
        const srcPoolId = stargatePoolId[from.symbol as StargateBridgeToken];
        const dstPoolId = stargatePoolId[to.symbol as StargateBridgeToken];
        const srcSupportedPools = stargateBlockchainSupportedPools[fromBlockchain];
        const dstSupportedPools = stargateBlockchainSupportedPools[toBlockchain];

        if (
            !(
                srcPoolId === dstPoolId &&
                srcSupportedPools.includes(srcPoolId) &&
                dstSupportedPools.includes(dstPoolId)
            )
        ) {
            throw new RubicSdkError('Unsupported token pair');
        }
    }

    public async calculate(
        from: PriceTokenAmount<EvmBlockchainName>,
        toToken: PriceToken<EvmBlockchainName>,
        options: RequiredCrossChainOptions
    ): Promise<CalculationResult> {
        try {
            const fromBlockchain = from.blockchain as StargateCrossChainSupportedBlockchain;
            const toBlockchain = toToken.blockchain as StargateCrossChainSupportedBlockchain;

            if (!this.areSupportedBlockchains(fromBlockchain, toBlockchain)) {
                return null;
            }
            this.checkIsSupportedTokens(from, toToken);

            const amountOutMin = from.tokenAmount.multipliedBy(1 - options.slippageTolerance);
            const to = new PriceTokenAmount({
                ...toToken.asStruct,
                tokenAmount: amountOutMin
            });
            this.feeInfo = await this.getFeeInfo(fromBlockchain, options.providerAddress);
            const layerZeroFeeWei = await this.getLayerZeroFee(from, to, amountOutMin);
            const layerZeroFeeAmount = Web3Pure.fromWei(
                layerZeroFeeWei,
                nativeTokensList[fromBlockchain].decimals
            );
            this.feeInfo.provider = {
                cryptoFee: {
                    amount: layerZeroFeeAmount,
                    tokenSymbol: nativeTokensList[fromBlockchain].symbol
                }
            };

            return {
                trade: new StargateCrossChainTrade(
                    {
                        from,
                        to,
                        toTokenAmountMin: amountOutMin,
                        slippageTolerance: options.slippageTolerance,
                        priceImpact: null,
                        gasData: null,
                        feeInfo: this.feeInfo
                    },
                    options.providerAddress
                )
            };
        } catch (error) {
            console.error({ 'CALCULATE ERROR': error });
            return {
                trade: null,
                error: parseError(error)
            };
        }
    }

    private async getLayerZeroFee(
        from: PriceTokenAmount<EvmBlockchainName>,
        to: PriceTokenAmount<EvmBlockchainName>,
        amountOutMin: BigNumber
    ): Promise<BigNumber> {
        const layzerZeroTxData = await StargateCrossChainTrade.getLayerZeroSwapData(
            from,
            to,
            amountOutMin
        );
        const web3Public = Injector.web3PublicService.getWeb3Public(from.blockchain);
        const walletAddress = Injector.web3PrivateService.getWeb3Private(CHAIN_TYPE.EVM).address;
        const layerZeroFee = await web3Public.callContractMethod(
            stargateContractAddress[from.blockchain as StargateCrossChainSupportedBlockchain],
            stargateRouterAbi,
            'quoteLayerZeroFee',
            [
                stargateChainId[to.blockchain as StargateCrossChainSupportedBlockchain],
                1,
                walletAddress || EvmWeb3Pure.EMPTY_ADDRESS,
                layzerZeroTxData.data,
                ['0', '0', walletAddress || EvmWeb3Pure.EMPTY_ADDRESS]
            ]
        );
        console.log({ TRADE_FEE: layerZeroFee['0'] });
        return new BigNumber(`${layerZeroFee['0']!}`);
    }

    protected async getFeeInfo(
        fromBlockchain: Partial<EvmBlockchainName>,
        providerAddress: string
    ): Promise<FeeInfo> {
        return {
            rubicProxy: {
                fixedFee: {
                    amount: await this.getFixedFee(
                        fromBlockchain,
                        providerAddress,
                        RANGO_CONTRACT_ADDRESSES[
                            fromBlockchain as RangoCrossChainSupportedBlockchain
                        ].rubicRouter,
                        evmCommonCrossChainAbi
                    ),
                    tokenSymbol: nativeTokensList[fromBlockchain].symbol
                },
                platformFee: {
                    percent: await this.getFeePercent(
                        fromBlockchain,
                        providerAddress,
                        RANGO_CONTRACT_ADDRESSES[
                            fromBlockchain as RangoCrossChainSupportedBlockchain
                        ].rubicRouter,
                        evmCommonCrossChainAbi
                    ),
                    tokenSymbol: 'USDC'
                }
            }
        };
    }
}