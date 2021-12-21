import { GasPriceApi } from '@common/http/gas-price-api';
import { combineOptions } from '@common/utils/options';
import { PriceTokenAmount } from '@core/blockchain/tokens/price-token-amount';
import { Token } from '@core/blockchain/tokens/token';
import { Injector } from '@core/sdk/injector';
import { oneinchApiParams } from '@features/swap/dexes/common/oneinch-common/constants';
import { RubicSdkError } from '@common/errors/rubic-sdk-error';
import { OneinchQuoteRequest } from '@features/swap/dexes/common/oneinch-common/models/oneinch-quote-request';
import { OneinchQuoteResponse } from '@features/swap/dexes/common/oneinch-common/models/oneinch-quote-response';
import { OneinchSwapRequest } from '@features/swap/dexes/common/oneinch-common/models/oneinch-swap-request';
import { OneinchSwapResponse } from '@features/swap/dexes/common/oneinch-common/models/oneinch-swap-response';
import { OneinchTokensResponse } from '@features/swap/dexes/common/oneinch-common/models/oneinch-tokens-response';
import { getOneinchApiBaseUrl } from '@features/swap/dexes/common/oneinch-common/utils';
import BigNumber from 'bignumber.js';

import { PriceToken } from '@core/blockchain/tokens/price-token';
import { OneinchTrade } from '@features/swap/dexes/common/oneinch-common/oneinch-trade';
import { InstantTradeProvider } from '@features/swap/instant-trade-provider';
import { SwapCalculationOptions } from '@features/swap/models/swap-calculation-options';
import { Pure } from '@common/decorators/pure.decorator';
import { createTokenNativeAddressProxy } from '@features/swap/dexes/common/utils/token-native-address-proxy';

type OneinchSwapCalculationOptions = Omit<SwapCalculationOptions, 'deadlineMinutes'>;

export abstract class OneinchAbstractProvider extends InstantTradeProvider {
    private readonly httpClient = Injector.httpClient;

    private readonly defaultOptions: Required<OneinchSwapCalculationOptions> = {
        gasCalculation: 'calculate',
        disableMultihops: false,
        slippageTolerance: 0.02
    };

    protected readonly gasMargin = 1;

    private supportedTokens: string[] = [];

    private get walletAddress(): string {
        return Injector.web3Private.address;
    }

    @Pure
    private get apiBaseUrl(): string {
        return getOneinchApiBaseUrl(this.blockchain);
    }

    private async getSupportedTokensByBlockchain(): Promise<string[]> {
        if (this.supportedTokens.length) {
            return this.supportedTokens;
        }

        const oneinchTokensResponse: OneinchTokensResponse = await this.httpClient.get(
            `${this.apiBaseUrl}/tokens`
        );
        this.supportedTokens = Object.keys(oneinchTokensResponse.tokens).map(tokenAddress =>
            tokenAddress.toLowerCase()
        );

        return this.supportedTokens;
    }

    private async loadContractAddress(): Promise<string> {
        const response = await this.httpClient.get<{
            address: string;
        }>(`${this.apiBaseUrl}/approve/spender`);
        return response.address;
    }

    public async calculate(
        from: PriceTokenAmount,
        toToken: PriceToken,
        options?: OneinchSwapCalculationOptions
    ): Promise<OneinchTrade> {
        const fullOptions = combineOptions(options, this.defaultOptions);

        const fromClone = createTokenNativeAddressProxy(from, oneinchApiParams.nativeAddress);
        const toTokenClone = createTokenNativeAddressProxy(toToken, oneinchApiParams.nativeAddress);

        const supportedTokensAddresses = await this.getSupportedTokensByBlockchain();
        if (
            !supportedTokensAddresses.includes(fromClone.address.toLowerCase()) ||
            !supportedTokensAddresses.includes(toTokenClone.address.toLowerCase())
        ) {
            throw new RubicSdkError("Oneinch doesn't support this tokens");
        }

        const [contractAddress, { toTokenAmountInWei, estimatedGas, path }] = await Promise.all([
            this.loadContractAddress(),
            this.getTradeInfo(fromClone, toTokenClone, fullOptions)
        ]);
        path[0] = from;
        path[path.length - 1] = toToken;

        const oneinchTradeStruct = {
            contractAddress,
            from: fromClone,
            to: new PriceTokenAmount({
                ...toTokenClone.asStruct,
                weiAmount: toTokenAmountInWei
            }),
            slippageTolerance: fullOptions.slippageTolerance,
            disableMultihops: fullOptions.disableMultihops,
            path
        };
        if (
            fullOptions.gasCalculation === 'disabled' ||
            !GasPriceApi.isSupportedBlockchain(from.blockchain)
        ) {
            return new OneinchTrade(oneinchTradeStruct);
        }

        const gasPriceInfo = await this.getGasPriceInfo();
        const gasFeeInfo = this.getGasFeeInfo(estimatedGas, gasPriceInfo);
        return new OneinchTrade({
            ...oneinchTradeStruct,
            gasFeeInfo
        });
    }

    private async getTradeInfo(
        from: PriceTokenAmount,
        toToken: Token,
        options: Required<OneinchSwapCalculationOptions>
    ): Promise<{ toTokenAmountInWei: BigNumber; estimatedGas: BigNumber; path: Token[] }> {
        const quoteTradeParams: OneinchQuoteRequest = {
            params: {
                fromTokenAddress: from.address,
                toTokenAddress: toToken.address,
                amount: from.stringWeiAmount,
                mainRouteParts: options.disableMultihops ? '1' : undefined
            }
        };

        let oneInchTrade: OneinchSwapResponse | OneinchQuoteResponse;
        let estimatedGas: BigNumber;
        let toTokenAmount: string;
        try {
            await OneinchTrade.checkIfNeedApproveAndThrowError(from);

            const swapTradeParams: OneinchSwapRequest = {
                params: {
                    ...quoteTradeParams.params,
                    slippage: (options.slippageTolerance * 100).toString(),
                    fromAddress: this.walletAddress
                }
            };
            oneInchTrade = await this.httpClient.get<OneinchSwapResponse>(
                `${this.apiBaseUrl}/swap`,
                swapTradeParams
            );

            estimatedGas = new BigNumber(oneInchTrade.tx.gas);
            toTokenAmount = oneInchTrade.toTokenAmount;
        } catch (_err) {
            oneInchTrade = await this.httpClient.get<OneinchQuoteResponse>(
                `${this.apiBaseUrl}/quote`,
                quoteTradeParams
            );
            if (oneInchTrade.hasOwnProperty('errors') || !oneInchTrade.toTokenAmount) {
                throw new RubicSdkError('1inch quote error');
            }

            estimatedGas = new BigNumber(oneInchTrade.estimatedGas);
            toTokenAmount = oneInchTrade.toTokenAmount;
        }

        const path = await this.extractPath(from, toToken, oneInchTrade);

        return { toTokenAmountInWei: new BigNumber(toTokenAmount), estimatedGas, path };
    }

    /**
     * Extracts tokens path from oneInch api response.
     * @return Promise<Token[]> Tokens array, used in the route.
     */
    private async extractPath(
        fromToken: Token,
        toToken: Token,
        oneInchTrade: OneinchSwapResponse | OneinchQuoteResponse
    ): Promise<Token[]> {
        const addressesPath = oneInchTrade.protocols[0].map(protocol => protocol[0].toTokenAddress);
        addressesPath.pop();

        const tokensPath = await Token.createTokens(addressesPath, this.blockchain);

        return [fromToken, ...tokensPath, toToken];
    }
}