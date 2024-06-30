import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { approveToken } from './approveToken';
import { depositCollateral } from './depositCollateral';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useErrorParser } from './parseError';
import { useCoreProxy } from './useCoreProxy';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function useDeposit() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: CoreProxyContract } = useCoreProxy();

  const errorParser = useErrorParser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputAmount: string) => {
      if (
        !(
          wallet &&
          walletAddress &&
          CoreProxyContract &&
          connectedChain?.id &&
          accountId &&
          collateralType
        )
      ) {
        throw 'OMFG';
      }

      const filteredInput = `${inputAmount}`.replace(/[^0-9.]+/gi, '');
      const depositAmount = filteredInput
        ? ethers.utils.parseUnits(inputAmount.trim(), collateralType.decimals)
        : ethers.BigNumber.from(0);

      if (!depositAmount.gt(0)) {
        throw new Error('Amount required');
      }

      const freshBalance = await fetchTokenBalance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress: collateralType?.address,
      });
      console.log(`freshBalance`, freshBalance);

      if (freshBalance.lt(depositAmount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress: collateralType?.address,
        spenderAddress: CoreProxyContract?.address,
      });
      console.log(`freshAllowance`, freshAllowance);

      if (freshAllowance.lt(depositAmount)) {
        await approveToken({
          wallet,
          tokenAddress: collateralType.address,
          spenderAddress: CoreProxyContract.address,
          allowance: depositAmount.sub(freshAllowance),
        });
      }

      console.log('-> depositCollateral');
      await depositCollateral({
        wallet,
        CoreProxyContract,
        accountId,
        tokenAddress: collateralType.address,
        depositAmount,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: async () => {
      // Intentionally do not await
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'AccountAvailableCollateral',
          {
            accountId: accountId?.toHexString(),
            tokenAddress: collateralType?.address,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'PositionCollateral',
          {
            accountId: accountId?.toHexString(),
            poolId: poolId?.toHexString(),
            tokenAddress: collateralType?.address,
          },
        ],
      });
    },
  });
}
