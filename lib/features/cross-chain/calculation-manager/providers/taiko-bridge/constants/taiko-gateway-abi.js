"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taikoERC20BridgeABI = exports.taikoNativeBridgeABI = void 0;
exports.taikoNativeBridgeABI = [
    {
        stateMutability: 'payable',
        type: 'function',
        inputs: [
            {
                name: 'message',
                internalType: 'struct IBridge.Message',
                type: 'tuple',
                components: [
                    { name: 'id', internalType: 'uint256', type: 'uint256' },
                    { name: 'from', internalType: 'address', type: 'address' },
                    { name: 'srcChainId', internalType: 'uint256', type: 'uint256' },
                    { name: 'destChainId', internalType: 'uint256', type: 'uint256' },
                    { name: 'user', internalType: 'address', type: 'address' },
                    { name: 'to', internalType: 'address', type: 'address' },
                    { name: 'refundTo', internalType: 'address', type: 'address' },
                    { name: 'value', internalType: 'uint256', type: 'uint256' },
                    { name: 'fee', internalType: 'uint256', type: 'uint256' },
                    { name: 'gasLimit', internalType: 'uint256', type: 'uint256' },
                    { name: 'data', internalType: 'bytes', type: 'bytes' },
                    { name: 'memo', internalType: 'string', type: 'string' }
                ]
            }
        ],
        name: 'sendMessage',
        outputs: [{ name: 'msgHash', internalType: 'bytes32', type: 'bytes32' }]
    }
];
exports.taikoERC20BridgeABI = [
    {
        stateMutability: 'payable',
        type: 'function',
        inputs: [
            {
                name: 'opt',
                internalType: 'struct ERC20Vault.BridgeTransferOp',
                type: 'tuple',
                components: [
                    { name: 'destChainId', internalType: 'uint256', type: 'uint256' },
                    { name: 'to', internalType: 'address', type: 'address' },
                    { name: 'token', internalType: 'address', type: 'address' },
                    { name: 'amount', internalType: 'uint256', type: 'uint256' },
                    { name: 'gasLimit', internalType: 'uint256', type: 'uint256' },
                    { name: 'fee', internalType: 'uint256', type: 'uint256' },
                    { name: 'refundTo', internalType: 'address', type: 'address' },
                    { name: 'memo', internalType: 'string', type: 'string' }
                ]
            }
        ],
        name: 'sendToken',
        outputs: []
    }
];
//# sourceMappingURL=taiko-gateway-abi.js.map