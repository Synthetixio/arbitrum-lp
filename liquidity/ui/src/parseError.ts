import { importAllErrors } from '@snx-v3/contracts';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';

export const PYTH_ERRORS = [
  // Function arguments are invalid (e.g., the arguments lengths mismatch)
  // Signature: 0xa9cb9e0d
  'error InvalidArgument()',
  // Update data is coming from an invalid data source.
  // Signature: 0xe60dce71
  'error InvalidUpdateDataSource()',
  // Update data is invalid (e.g., deserialization error)
  // Signature: 0xe69ffece
  'error InvalidUpdateData()',
  // Insufficient fee is paid to the method.
  // Signature: 0x025dbdd4
  'error InsufficientFee()',
  // There is no fresh update, whereas expected fresh updates.
  // Signature: 0xde2c57fa
  'error NoFreshUpdate()',
  // There is no price feed found within the given range or it does not exists.
  // Signature: 0x45805f5d
  'error PriceFeedNotFoundWithinRange()',
  // Price feed not found or it is not pushed on-chain yet.
  // Signature: 0x14aebe68
  'error PriceFeedNotFound()',
  // Requested price is stale.
  // Signature: 0x19abf40e
  'error StalePrice()',
  // Given message is not a valid Wormhole VAA.
  // Signature: 0x2acbe915
  'error InvalidWormholeVaa()',
  // Governance message is invalid (e.g., deserialization error).
  // Signature: 0x97363b35
  'error InvalidGovernanceMessage()',
  // Governance message is not for this contract.
  // Signature: 0x63daeb77
  'error InvalidGovernanceTarget()',
  // Governance message is coming from an invalid data source.
  // Signature: 0x360f2d87
  'error InvalidGovernanceDataSource()',
  // Governance message is old.
  // Signature: 0x88d1b847
  'error OldGovernanceMessage()',
  // The wormhole address to set in SetWormholeAddress governance is invalid.
  // Signature: 0x13d3ed82
  'error InvalidWormholeAddressToSet()',
];

export async function parseError({
  error,
  chainId,
  preset,
}: {
  error: any;
  chainId: string;
  preset: string;
}) {
  console.log({ error });
  let errorData = error.data || error.error?.data?.data || error.error?.error?.data;
  if (!errorData) {
    throw error;
  }

  if (`${errorData}`.startsWith('0x08c379a0')) {
    const content = `0x${errorData.substring(10)}`;
    // reason: string; for standard revert error string
    const reason = ethers.utils.defaultAbiCoder.decode(['string'], content);
    console.log(`Reason`, reason);
    return {
      name: reason[0],
      args: [],
    };
  }

  try {
    const AllErrors = await importAllErrors(chainId, preset);
    const AllErrorsInterface = new ethers.utils.Interface([...AllErrors.abi, ...PYTH_ERRORS]);
    const decodedError = AllErrorsInterface.parseError(errorData);
    console.log({ decodedError });
    return decodedError;
  } catch (parseError) {
    console.error(
      'Error is not a ERC7412 error, re-throwing original error, for better parsing. Parse error reason: ',
      parseError
    );
    // If we cant parse it, throw the original error
    throw error;
  }
}

export function useErrorParser() {
  const [{ wallet }] = useConnectWallet();
  const [{ connectedChain }] = useSetChain();
  return React.useCallback(
    (error: Error) => {
      if (wallet?.provider && connectedChain?.id) {
        const provider = new ethers.providers.Web3Provider(wallet.provider);
        parseError({ error, chainId: connectedChain.id, preset: 'main' });
        throw error;
      }
    },
    [wallet?.provider]
  );
}
