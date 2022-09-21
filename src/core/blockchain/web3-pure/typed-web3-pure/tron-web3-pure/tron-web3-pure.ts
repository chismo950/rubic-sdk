import { TypedWeb3Pure } from 'src/core/blockchain/web3-pure/typed-web3-pure/typed-web3-pure';
import { staticImplements } from 'src/common/utils/decorators';
import { compareAddresses } from 'src/common/utils/blockchain';
import { TronWeb } from 'src/core/blockchain/constants/tron/tron-web';
import { AbiInput, AbiItem, AbiOutput } from 'web3-utils';
import { InfiniteArray } from 'src/common/utils/types';
import { TronParameters } from 'src/core/blockchain/web3-pure/typed-web3-pure/tron-web3-pure/models/tron-parameters';
import { TronTransactionConfig } from 'src/core/blockchain/web3-pure/typed-web3-pure/tron-web3-pure/models/tron-transaction-config';
import { BigNumber as EthersBigNumber } from 'ethers';
import {
    TronWeb3PrimitiveType,
    Web3PrimitiveType
} from 'src/core/blockchain/models/web3-primitive-type';

@staticImplements<TypedWeb3Pure>()
export class TronWeb3Pure {
    public static get nativeTokenAddress(): string {
        return '0x0000000000000000000000000000000000000000';
    }

    public static isNativeAddress(address: string): boolean {
        return compareAddresses(address, TronWeb3Pure.nativeTokenAddress);
    }

    public static isEmptyAddress(address?: string): boolean {
        return Boolean(address) && address === '0x0000000000000000000000000000000000000000';
    }

    public static isAddressCorrect(address: string): boolean {
        return TronWeb.isAddress(address);
    }

    public static addressToHex(address: string): string {
        return TronWeb.address.toHex(address).replace(/^41/, '0x');
    }

    /**
     * Returns transaction config with encoded data.
     */
    public static encodeMethodCall(
        contractAddress: string,
        contractAbi: AbiItem[],
        methodName: string,
        methodArguments: unknown[] = [],
        callValue?: string,
        feeLimit?: number
    ): TronTransactionConfig {
        const data = this.encodeFunctionCall(contractAbi, methodName, methodArguments);
        return {
            to: contractAddress,
            data,
            callValue,
            feeLimit
        };
    }

    /**
     * Encodes a function call using its JSON interface object and given parameters.
     * @param contractAbi The JSON interface object of a function.
     * @param methodName Method name to encode.
     * @param methodArguments Parameters to encode.
     * @returns An ABI encoded function call. Means function signature + parameters.
     */
    public static encodeFunctionCall(
        contractAbi: AbiItem[],
        methodName: string,
        methodArguments: unknown[]
    ): string {
        const methodSignature = contractAbi.find(abiItem => abiItem.name === methodName);
        if (methodSignature === undefined) {
            throw Error('No such method in abi');
        }

        const encodedMethodSignature = TronWeb.sha3(
            `${methodSignature.name!}(${this.flattenTypesToString(methodSignature.inputs!).join(
                ','
            )})`
        ).slice(0, 10);
        const encodedParameters = TronWeb.utils.abi.encodeParams(
            this.flattenTypesToArray(methodSignature.inputs!),
            methodArguments
        );

        return encodedMethodSignature + encodedParameters.slice(2);
    }

    public static encodeMethodSignature(
        methodSignature: string,
        parameters: TronParameters
    ): string {
        const encodedMethodSignature = TronWeb.sha3(methodSignature).slice(0, 10);
        const flattenedParameters = this.flattenParameters(parameters);
        const encodedParameters = TronWeb.utils.abi.encodeParams(
            flattenedParameters[0],
            flattenedParameters[1]
        );

        return encodedMethodSignature + encodedParameters.slice(2);
    }

    /**
     * Decodes method result using its JSON interface object and given parameters.
     * @param outputAbi The JSON interface object of an output of function.
     * @param response Bytes code returned after method call.
     * @returns Parsed method output.
     */
    public static decodeMethodOutput(outputAbi: AbiOutput[], response: string): Web3PrimitiveType {
        const decodedParam: TronWeb3PrimitiveType = TronWeb.utils.abi.decodeParams(
            [],
            this.flattenTypesToArray(outputAbi),
            response
        )[0];
        return this.flattenParametersToPrimitive(decodedParam);
    }

    private static flattenTypesToString(abiInputs: (AbiInput | AbiOutput)[]): string[] {
        return abiInputs.map(abiInput => {
            if (abiInput.type === 'tuple') {
                const flattenedComponents = this.flattenTypesToString(abiInput.components!);
                return `(${flattenedComponents.join(',')})`;
            }
            return abiInput.type;
        });
    }

    private static flattenTypesToArray(abiInputs: (AbiInput | AbiOutput)[]): InfiniteArray<string> {
        return abiInputs.map(abiInput => {
            if (abiInput.type === 'tuple') {
                return this.flattenTypesToArray(abiInput.components!);
            }
            return abiInput.type;
        });
    }

    private static flattenParameters(
        parameters: TronParameters
    ): [InfiniteArray<string>, InfiniteArray<string>] {
        const types: InfiniteArray<string> = [];
        const values: InfiniteArray<string> = [];
        parameters.forEach(parameter => {
            if (parameter.type === 'tuple') {
                const flattenedParameters = this.flattenParameters(
                    parameter.value as TronParameters
                );
                types.push(flattenedParameters[0]);
                values.push(flattenedParameters[1]);
            } else {
                types.push(parameter.type);
                values.push(parameter.value as string);
            }
        });
        return [types, values];
    }

    public static flattenParametersToPrimitive(param: TronWeb3PrimitiveType): Web3PrimitiveType {
        if (typeof param === 'number' || param instanceof EthersBigNumber) {
            return param.toString();
        }
        if (Object.keys(param).length) {
            Object.keys(param).reduce(
                (acc, paramKey) => ({
                    ...acc,
                    [paramKey]: this.flattenParametersToPrimitive(
                        param[paramKey as keyof typeof param]
                    )
                }),
                {}
            );
        }
        return param as Web3PrimitiveType;
    }
}
