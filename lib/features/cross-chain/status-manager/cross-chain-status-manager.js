"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossChainStatusManager = void 0;
const sdk_1 = require("@arbitrum/sdk");
const providers_1 = require("@ethersproject/providers");
const scan_client_1 = require("@layerzerolabs/scan-client");
const errors_1 = require("../../../common/errors");
const blockchain_name_1 = require("../../../core/blockchain/models/blockchain-name");
const blockchains_info_1 = require("../../../core/blockchain/utils/blockchains-info/blockchains-info");
const blockchain_id_1 = require("../../../core/blockchain/utils/blockchains-info/constants/blockchain-id");
const tx_status_1 = require("../../../core/blockchain/web3-public-service/web3-public/models/tx-status");
const injector_1 = require("../../../core/injector/injector");
const changenow_api_key_1 = require("../../common/providers/changenow/constants/changenow-api-key");
const get_bridgers_trade_status_1 = require("../../common/status-manager/utils/get-bridgers-trade-status");
const get_src_tx_status_1 = require("../../common/status-manager/utils/get-src-tx-status");
const cross_chain_trade_type_1 = require("../calculation-manager/models/cross-chain-trade-type");
const cbridge_cross_chain_api_service_1 = require("../calculation-manager/providers/cbridge/cbridge-cross-chain-api-service");
const cbridge_status_response_1 = require("../calculation-manager/providers/cbridge/models/cbridge-status-response");
const debridge_cross_chain_provider_1 = require("../calculation-manager/providers/debridge-provider/debridge-cross-chain-provider");
const lifi_swap_status_1 = require("../calculation-manager/providers/lifi-provider/models/lifi-swap-status");
const squidrouter_cross_chain_provider_1 = require("../calculation-manager/providers/squidrouter-provider/squidrouter-cross-chain-provider");
const symbiosis_swap_status_1 = require("../calculation-manager/providers/symbiosis-provider/models/symbiosis-swap-status");
const xy_cross_chain_provider_1 = require("../calculation-manager/providers/xy-provider/xy-cross-chain-provider");
const cross_chain_cbridge_manager_1 = require("../cbridge-manager/cross-chain-cbridge-manager");
const multichain_status_mapping_1 = require("./constants/multichain-status-mapping");
const changenow_api_response_1 = require("./models/changenow-api-response");
const squidrouter_transfer_status_enum_1 = require("./models/squidrouter-transfer-status.enum");
const statuses_api_1 = require("./models/statuses-api");
const taiko_api_response_1 = require("./models/taiko-api-response");
/**
 * Contains methods for getting cross-chain trade statuses.
 */
class CrossChainStatusManager {
    constructor() {
        this.httpClient = injector_1.Injector.httpClient;
        this.LayzerZeroScanClient = (0, scan_client_1.createClient)('mainnet');
        this.getDstTxStatusFnMap = {
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.LIFI]: this.getLifiDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.SYMBIOSIS]: this.getSymbiosisDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.DEBRIDGE]: this.getDebridgeDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.BRIDGERS]: this.getBridgersDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.MULTICHAIN]: this.getMultichainDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.XY]: this.getXyDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.CELER_BRIDGE]: this.getCelerBridgeDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.CHANGENOW]: this.getChangenowDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.STARGATE]: this.getStargateDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.ARBITRUM]: this.getArbitrumBridgeDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.SQUIDROUTER]: this.getSquidrouterDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.SCROLL_BRIDGE]: this.getScrollBridgeDstSwapStatus,
            [cross_chain_trade_type_1.CROSS_CHAIN_TRADE_TYPE.TAIKO_BRIDGE]: this.getTaikoBridgeDstSwapStatus
        };
    }
    /**
     * Returns cross-chain trade statuses on the source and target networks.
     * The result consists of statuses of the source and target transactions and destination tx hash.
     * @example
     * ```ts
     * const tradeData = {
     *   fromBlockchain: BLOCKCHAIN_NAME.FANTOM,
     *   toBlockchain: BLOCKCHAIN_NAME.BSC,
     *   txTimestamp: 1658241570024,
     *   srxTxHash: '0xd2263ca82ac0fce606cb75df27d7f0dc94909d41a58c37563bd6772496cb8924'
     * };
     * const tradeType = CROSS_CHAIN_TRADE_TYPE.VIA;
     * const crossChainStatus = await sdk.crossChainStatusManager.getCrossChainStatus(tradeData, tradeType);
     * console.log('Source transaction status', crossChainStatus.srcTxStatus);
     * console.log('Destination transaction status', crossChainStatus.dstTxStatus);
     * console.log('Destination transaction hash', crossChainStatus.dstTxHash);
     * ```
     * @param data Data needed to calculate statuses.
     * @param tradeType Cross-chain trade type.
     * @returns Object with transaction statuses and hash.
     */
    async getCrossChainStatus(data, tradeType) {
        const { fromBlockchain, srcTxHash } = data;
        let srcTxStatus = await (0, get_src_tx_status_1.getSrcTxStatus)(fromBlockchain, srcTxHash);
        const dstTxData = await this.getDstTxData(srcTxStatus, data, tradeType);
        if (dstTxData.status === tx_status_1.TX_STATUS.FAIL && srcTxStatus === tx_status_1.TX_STATUS.PENDING) {
            srcTxStatus = tx_status_1.TX_STATUS.FAIL;
        }
        return {
            srcTxStatus,
            dstTxStatus: dstTxData.status,
            dstTxHash: dstTxData.hash
        };
    }
    /**
     * Get destination transaction status and hash based on source transaction status,
     * source transaction receipt, trade data and type.
     * @param srcTxStatus Source transaction status.
     * @param tradeData Trade data.
     * @param tradeType Cross-chain trade type.
     * @returns Cross-chain transaction status and hash.
     */
    async getDstTxData(srcTxStatus, tradeData, tradeType) {
        if (srcTxStatus === tx_status_1.TX_STATUS.FAIL) {
            return { hash: null, status: tx_status_1.TX_STATUS.FAIL };
        }
        if (srcTxStatus === tx_status_1.TX_STATUS.PENDING) {
            return { hash: null, status: tx_status_1.TX_STATUS.PENDING };
        }
        const getDstTxStatusFn = this.getDstTxStatusFnMap[tradeType];
        if (!getDstTxStatusFn) {
            throw new errors_1.RubicSdkError('Unsupported cross chain provider');
        }
        return getDstTxStatusFn.call(this, tradeData);
    }
    /**
     * Get Stargate trade dst transaction status and hash.
     * @param data Trade data.
     * @returns Cross-chain transaction status and hash.
     */
    async getStargateDstSwapStatus(data) {
        const scanResponse = await this.LayzerZeroScanClient.getMessagesBySrcTxHash(data.srcTxHash);
        const targetTrade = scanResponse.messages.find(item => item.srcTxHash.toLocaleLowerCase() === data.srcTxHash.toLocaleLowerCase());
        const txStatusData = {
            status: tx_status_1.TX_STATUS.PENDING,
            hash: null
        };
        if (targetTrade?.dstTxHash) {
            txStatusData.hash = targetTrade.dstTxHash;
        }
        if (targetTrade?.status === 'DELIVERED') {
            txStatusData.status = tx_status_1.TX_STATUS.SUCCESS;
        }
        if (targetTrade?.status === 'INFLIGHT') {
            txStatusData.status = tx_status_1.TX_STATUS.PENDING;
        }
        if (targetTrade?.status === 'FAILED') {
            txStatusData.status = tx_status_1.TX_STATUS.FAIL;
        }
        return txStatusData;
    }
    /**
     * Get Symbiosis trade dst transaction status and hash.
     * @param data Trade data.
     * @returns Cross-chain transaction status and hash.
     */
    async getSymbiosisDstSwapStatus(data) {
        const symbiosisTxIndexingTimeSpent = Date.now() > data.txTimestamp + 30000;
        const symbiosisApi = Object.keys(blockchain_name_1.TEST_EVM_BLOCKCHAIN_NAME).includes(data.fromBlockchain)
            ? 'api.testnet'
            : 'api-v2';
        if (symbiosisTxIndexingTimeSpent) {
            try {
                const srcChainId = blockchain_id_1.blockchainId[data.fromBlockchain];
                const toBlockchainId = blockchain_id_1.blockchainId[data.toBlockchain];
                const { status: { text: dstTxStatus }, tx, transitTokenSent } = await injector_1.Injector.httpClient.get(`https://${symbiosisApi}.symbiosis.finance/crosschain/v1/tx/${srcChainId}/${data.srcTxHash}`);
                let dstTxData = {
                    status: tx_status_1.TX_STATUS.PENDING,
                    hash: tx?.hash || null
                };
                const targetTokenNetwork = tx?.chainId;
                if (dstTxStatus === symbiosis_swap_status_1.SYMBIOSIS_SWAP_STATUS.PENDING ||
                    dstTxStatus === symbiosis_swap_status_1.SYMBIOSIS_SWAP_STATUS.NOT_FOUND) {
                    return { ...dstTxData, status: tx_status_1.TX_STATUS.PENDING };
                }
                if (dstTxStatus === symbiosis_swap_status_1.SYMBIOSIS_SWAP_STATUS.STUCKED) {
                    return { ...dstTxData, status: tx_status_1.TX_STATUS.REVERT };
                }
                if (dstTxStatus === symbiosis_swap_status_1.SYMBIOSIS_SWAP_STATUS.REVERTED || transitTokenSent) {
                    return { ...dstTxData, status: tx_status_1.TX_STATUS.FALLBACK };
                }
                if (dstTxStatus === symbiosis_swap_status_1.SYMBIOSIS_SWAP_STATUS.SUCCESS &&
                    targetTokenNetwork === toBlockchainId) {
                    if (data.toBlockchain !== blockchain_name_1.BLOCKCHAIN_NAME.BITCOIN) {
                        dstTxData.status = tx_status_1.TX_STATUS.SUCCESS;
                    }
                    else {
                        dstTxData = await this.getBitcoinStatus(tx.hash);
                    }
                }
                return dstTxData;
            }
            catch (error) {
                console.debug('[Symbiosis Trade] Error retrieving dst tx status', error);
                return {
                    status: tx_status_1.TX_STATUS.PENDING,
                    hash: null
                };
            }
        }
        return {
            status: tx_status_1.TX_STATUS.PENDING,
            hash: null
        };
    }
    /**
     * Get Li-fi trade dst transaction status and hash.
     * @param data Trade data.
     * @returns Cross-chain transaction status and hash.
     */
    async getLifiDstSwapStatus(data) {
        if (!data.lifiBridgeType) {
            return {
                status: tx_status_1.TX_STATUS.PENDING,
                hash: null
            };
        }
        try {
            const params = {
                bridge: data.lifiBridgeType,
                fromChain: blockchain_id_1.blockchainId[data.fromBlockchain],
                toChain: blockchain_id_1.blockchainId[data.toBlockchain],
                txHash: data.srcTxHash
            };
            const { status, receiving } = await injector_1.Injector.httpClient.get('https://li.quest/v1/status', { params });
            const dstTxData = {
                status: tx_status_1.TX_STATUS.UNKNOWN,
                hash: receiving?.txHash || null
            };
            if (status === lifi_swap_status_1.LIFI_SWAP_STATUS.DONE) {
                dstTxData.status = tx_status_1.TX_STATUS.SUCCESS;
            }
            if (status === lifi_swap_status_1.LIFI_SWAP_STATUS.FAILED) {
                dstTxData.status = tx_status_1.TX_STATUS.FAIL;
            }
            if (status === lifi_swap_status_1.LIFI_SWAP_STATUS.INVALID) {
                dstTxData.status = tx_status_1.TX_STATUS.UNKNOWN;
            }
            if (status === lifi_swap_status_1.LIFI_SWAP_STATUS.NOT_FOUND || status === lifi_swap_status_1.LIFI_SWAP_STATUS.PENDING) {
                dstTxData.status = tx_status_1.TX_STATUS.PENDING;
            }
            return dstTxData;
        }
        catch (error) {
            console.debug('[Li-fi Trade] error retrieving tx status', error);
            return {
                status: tx_status_1.TX_STATUS.PENDING,
                hash: null
            };
        }
    }
    /**
     * Get DeBridge trade dst transaction status.
     * @param data Trade data.
     * @returns Cross-chain transaction status and hash.
     */
    async getDebridgeDstSwapStatus(data) {
        try {
            const { orderIds } = await this.httpClient.get(`${debridge_cross_chain_provider_1.DebridgeCrossChainProvider.apiEndpoint}/tx/${data.srcTxHash}/order-ids`);
            if (!orderIds.length) {
                return {
                    status: tx_status_1.TX_STATUS.PENDING,
                    hash: null
                };
            }
            const orderId = orderIds[0];
            const dstTxData = {
                status: tx_status_1.TX_STATUS.PENDING,
                hash: null
            };
            const { status } = await this.httpClient.get(`${debridge_cross_chain_provider_1.DebridgeCrossChainProvider.apiEndpoint}/order/${orderId}/status`);
            if (status === statuses_api_1.DE_BRIDGE_API_STATE_STATUS.FULFILLED ||
                status === statuses_api_1.DE_BRIDGE_API_STATE_STATUS.SENTUNLOCK ||
                status === statuses_api_1.DE_BRIDGE_API_STATE_STATUS.CLAIMEDUNLOCK) {
                const { fulfilledDstEventMetadata } = await this.httpClient.get(`https://stats-api.dln.trade/api/Orders/${orderId}`);
                dstTxData.hash = fulfilledDstEventMetadata.transactionHash.stringValue;
                dstTxData.status = tx_status_1.TX_STATUS.SUCCESS;
            }
            else if (status === statuses_api_1.DE_BRIDGE_API_STATE_STATUS.ORDERCANCELLED ||
                status === statuses_api_1.DE_BRIDGE_API_STATE_STATUS.SENTORDERCANCEL ||
                status === statuses_api_1.DE_BRIDGE_API_STATE_STATUS.CLAIMEDORDERCANCEL) {
                dstTxData.status = tx_status_1.TX_STATUS.FAIL;
            }
            return dstTxData;
        }
        catch {
            return {
                status: tx_status_1.TX_STATUS.PENDING,
                hash: null
            };
        }
    }
    /**
     * Get Bridgers trade dst transaction status.
     * @param data Trade data.
     * @returns Cross-chain transaction status.
     */
    getBridgersDstSwapStatus(data) {
        if (!data.amountOutMin) {
            throw new errors_1.RubicSdkError('field amountOutMin is not set.');
        }
        return (0, get_bridgers_trade_status_1.getBridgersTradeStatus)(data.srcTxHash, data.fromBlockchain, 'rubic', data.amountOutMin);
    }
    /**
     * @internal
     * Get transaction status in bitcoin network;
     * @param hash Bitcoin transaction hash.
     */
    async getBitcoinStatus(hash) {
        let bitcoinTransactionStatus;
        const dstTxData = {
            status: tx_status_1.TX_STATUS.PENDING,
            hash: null
        };
        try {
            const btcStatusApi = 'https://blockchain.info/rawtx/';
            bitcoinTransactionStatus = await this.httpClient.get(`${btcStatusApi}${hash}`);
            dstTxData.hash = bitcoinTransactionStatus?.hash || null;
        }
        catch {
            return {
                status: tx_status_1.TX_STATUS.PENDING,
                hash: null
            };
        }
        const isCompleted = bitcoinTransactionStatus?.block_index !== undefined;
        if (isCompleted) {
            dstTxData.status = tx_status_1.TX_STATUS.SUCCESS;
        }
        return dstTxData;
    }
    async getMultichainDstSwapStatus(data) {
        try {
            const { info: { status, swaptx } } = await this.httpClient.get(`https://bridgeapi.anyswap.exchange/v2/history/details?params=${data.srcTxHash}`);
            return {
                status: multichain_status_mapping_1.MULTICHAIN_STATUS_MAPPING?.[status] || tx_status_1.TX_STATUS.PENDING,
                hash: swaptx || null
            };
        }
        catch {
            return {
                status: tx_status_1.TX_STATUS.PENDING,
                hash: null
            };
        }
    }
    async getXyDstSwapStatus(data) {
        try {
            const { isSuccess, status, txHash } = await this.httpClient.get(`${xy_cross_chain_provider_1.XyCrossChainProvider.apiEndpoint}/crossChainStatus?srcChainId=${blockchain_id_1.blockchainId[data.fromBlockchain]}&transactionHash=${data.srcTxHash}`);
            if (isSuccess && status === 'Done') {
                return { status: tx_status_1.TX_STATUS.SUCCESS, hash: txHash };
            }
            if (!isSuccess) {
                return { status: tx_status_1.TX_STATUS.FAIL, hash: null };
            }
            return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
        }
        catch {
            return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
        }
    }
    async getCelerBridgeDstSwapStatus(data) {
        try {
            const transferId = await cross_chain_cbridge_manager_1.CrossChainCbridgeManager.getTransferId(data.srcTxHash, data.fromBlockchain);
            const useTestnet = blockchains_info_1.BlockchainsInfo.isTestBlockchainName(data.fromBlockchain);
            const swapData = await cbridge_cross_chain_api_service_1.CbridgeCrossChainApiService.fetchTradeStatus(transferId, {
                useTestnet
            });
            const transformedStatus = cbridge_status_response_1.TRANSFER_HISTORY_STATUS_CODE[swapData.status];
            switch (transformedStatus) {
                case cbridge_status_response_1.TRANSFER_HISTORY_STATUS.TRANSFER_UNKNOWN:
                case cbridge_status_response_1.TRANSFER_HISTORY_STATUS.TRANSFER_SUBMITTING:
                case cbridge_status_response_1.TRANSFER_HISTORY_STATUS.TRANSFER_WAITING_FOR_SGN_CONFIRMATION:
                case cbridge_status_response_1.TRANSFER_HISTORY_STATUS.TRANSFER_REQUESTING_REFUND:
                case cbridge_status_response_1.TRANSFER_HISTORY_STATUS.TRANSFER_CONFIRMING_YOUR_REFUND:
                default:
                    return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
                case cbridge_status_response_1.TRANSFER_HISTORY_STATUS.TRANSFER_REFUNDED:
                case cbridge_status_response_1.TRANSFER_HISTORY_STATUS.TRANSFER_COMPLETED:
                    return {
                        status: tx_status_1.TX_STATUS.SUCCESS,
                        hash: swapData.dst_block_tx_link.split('/').at(-1)
                    };
                case cbridge_status_response_1.TRANSFER_HISTORY_STATUS.TRANSFER_FAILED:
                    return {
                        status: tx_status_1.TX_STATUS.FAIL,
                        hash: null
                    };
                case cbridge_status_response_1.TRANSFER_HISTORY_STATUS.TRANSFER_WAITING_FOR_FUND_RELEASE:
                case cbridge_status_response_1.TRANSFER_HISTORY_STATUS.TRANSFER_TO_BE_REFUNDED:
                    return cbridge_status_response_1.XFER_STATUS_CODE[swapData.refund_reason] === cbridge_status_response_1.XFER_STATUS.OK_TO_RELAY
                        ? {
                            status: tx_status_1.TX_STATUS.PENDING,
                            hash: null
                        }
                        : {
                            status: tx_status_1.TX_STATUS.REVERT,
                            hash: null
                        };
            }
        }
        catch {
            return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
        }
    }
    async getChangenowDstSwapStatus(data) {
        if (!data.changenowId) {
            throw new errors_1.RubicSdkError('Must provide changenow trade id');
        }
        try {
            const { status, payoutHash } = await this.httpClient.get('https://api.changenow.io/v2/exchange/by-id', {
                params: { id: data.changenowId },
                headers: { 'x-changenow-api-key': changenow_api_key_1.changenowApiKey }
            });
            if (status === changenow_api_response_1.CHANGENOW_API_STATUS.FINISHED ||
                status === changenow_api_response_1.CHANGENOW_API_STATUS.REFUNDED) {
                return { status: tx_status_1.TX_STATUS.SUCCESS, hash: payoutHash };
            }
            if (status === changenow_api_response_1.CHANGENOW_API_STATUS.FAILED) {
                return { status: tx_status_1.TX_STATUS.FAIL, hash: null };
            }
            return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
        }
        catch {
            return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
        }
    }
    async getArbitrumBridgeDstSwapStatus(data) {
        const rpcProviders = injector_1.Injector.web3PublicService.rpcProvider;
        const l1Provider = new providers_1.JsonRpcProvider(rpcProviders[blockchain_name_1.BLOCKCHAIN_NAME.ETHEREUM].rpcList[0], 1);
        const l2Provider = new providers_1.JsonRpcProvider(rpcProviders[blockchain_name_1.BLOCKCHAIN_NAME.ARBITRUM].rpcList[0], 42161);
        // L1 to L2 deposit
        if (data.fromBlockchain === blockchain_name_1.BLOCKCHAIN_NAME.ETHEREUM) {
            try {
                const sourceTx = await l1Provider.getTransactionReceipt(data.srcTxHash);
                const l1TxReceipt = new sdk_1.L1TransactionReceipt(sourceTx);
                const [l1ToL2Msg] = await l1TxReceipt.getL1ToL2Messages(l2Provider);
                const response = await l1ToL2Msg.getSuccessfulRedeem();
                switch (response.status) {
                    case sdk_1.L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2:
                        return { status: tx_status_1.TX_STATUS.REVERT, hash: null };
                    case sdk_1.L1ToL2MessageStatus.EXPIRED:
                    case sdk_1.L1ToL2MessageStatus.CREATION_FAILED:
                        return { status: tx_status_1.TX_STATUS.FAIL, hash: null };
                    case sdk_1.L1ToL2MessageStatus.REDEEMED:
                        return {
                            status: tx_status_1.TX_STATUS.SUCCESS,
                            hash: response.l2TxReceipt.transactionHash
                        };
                    case sdk_1.L1ToL2MessageStatus.NOT_YET_CREATED:
                    default:
                        return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
                }
            }
            catch {
                return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
            }
        }
        // L2 to L1 withdraw
        try {
            const targetReceipt = await l2Provider.getTransactionReceipt(data.srcTxHash);
            const l2TxReceipt = new sdk_1.L2TransactionReceipt(targetReceipt);
            const [event] = l2TxReceipt.getL2ToL1Events();
            if (!event) {
                return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
            }
            const messageReader = new sdk_1.L2ToL1MessageReader(l1Provider, event);
            const status = await messageReader.status(l2Provider);
            switch (status) {
                case sdk_1.L2ToL1MessageStatus.CONFIRMED:
                    return { status: tx_status_1.TX_STATUS.READY_TO_CLAIM, hash: null };
                case sdk_1.L2ToL1MessageStatus.EXECUTED:
                    return { status: tx_status_1.TX_STATUS.SUCCESS, hash: null };
                case sdk_1.L2ToL1MessageStatus.UNCONFIRMED:
                default:
                    return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
            }
        }
        catch (error) {
            return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
        }
    }
    async getSquidrouterDstSwapStatus(data) {
        try {
            const { status, toChain } = await this.httpClient.get(`${squidrouter_cross_chain_provider_1.SquidrouterCrossChainProvider.apiEndpoint}status?transactionId=${data.srcTxHash}`, { headers: { 'x-integrator-id': 'rubic-api' } });
            if (status === squidrouter_transfer_status_enum_1.SQUIDROUTER_TRANSFER_STATUS.DEST_EXECUTED ||
                status === squidrouter_transfer_status_enum_1.SQUIDROUTER_TRANSFER_STATUS.EXPRESS_EXECUTED) {
                return { status: tx_status_1.TX_STATUS.SUCCESS, hash: toChain.transactionId };
            }
            if (status === squidrouter_transfer_status_enum_1.SQUIDROUTER_TRANSFER_STATUS.DEST_ERROR) {
                return { status: tx_status_1.TX_STATUS.FAIL, hash: null };
            }
            return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
        }
        catch {
            return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
        }
    }
    async getScrollBridgeDstSwapStatus(data) {
        const response = await injector_1.Injector.httpClient.post('https://alpha-api.scroll.io/bridgehistory/api/txsbyhashes', {
            txs: [data.srcTxHash]
        });
        const sourceTx = response.data.result[0];
        const targetHash = sourceTx?.finalizeTx?.hash;
        if (targetHash) {
            return { status: tx_status_1.TX_STATUS.SUCCESS, hash: targetHash };
        }
        return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
    }
    async getTaikoBridgeDstSwapStatus(data) {
        if (!data.taikoTransactionId) {
            throw new errors_1.RubicSdkError('Must provide Taiko transaction ID');
        }
        if (!data.sender) {
            throw new errors_1.RubicSdkError('Must specify sender account');
        }
        const { items } = await injector_1.Injector.httpClient.get(`https://relayer.jolnir.taiko.xyz/events?address=${data.sender}&msgHash=${data.taikoTransactionId}&event=MessageSent`);
        if (!items[0]) {
            throw new errors_1.RubicSdkError('Taiko Relayer did not find transaction with such ID');
        }
        const { status, data: taikoData } = items[0];
        if (status === taiko_api_response_1.TAIKO_API_STATUS.DONE) {
            return { status: tx_status_1.TX_STATUS.SUCCESS, hash: taikoData.Raw.transactionHash };
        }
        return { status: tx_status_1.TX_STATUS.PENDING, hash: null };
    }
}
exports.CrossChainStatusManager = CrossChainStatusManager;
//# sourceMappingURL=cross-chain-status-manager.js.map