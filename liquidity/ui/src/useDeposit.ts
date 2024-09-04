import { useErrorParser, useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import type { ethers } from 'ethers';
import { approveToken } from './approveToken';
import { depositCollateral } from './depositCollateral';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function useDeposit({ onSuccess }: { onSuccess: () => void }) {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  const errorParser = useErrorParser();
  const queryClient = useQueryClient();
  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);
  return useMutation({
    mutationFn: async (depositAmount: ethers.BigNumber) => {
      if (!(isChainReady && CoreProxyContract && wallet && walletAddress && accountId && collateralType)) {
        throw 'OMFG';
      }

      if (depositAmount.lte(0)) {
        throw new Error('Amount required');
      }

      const freshBalance = await fetchTokenBalance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress: collateralType?.address,
      });
      console.log('freshBalance', freshBalance);

      if (freshBalance.lt(depositAmount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress: collateralType?.address,
        spenderAddress: CoreProxyContract?.address,
      });
      console.log('freshAllowance', freshAllowance);

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
          chainId,
          { CoreProxy: CoreProxyContract?.address },
          {
            accountId: accountId?.toHexString(),
            tokenAddress: collateralType?.address,
          },
          'AccountAvailableCollateral',
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          { CoreProxy: CoreProxyContract?.address },
          {
            accountId: accountId?.toHexString(),
            poolId: poolId?.toHexString(),
            tokenAddress: collateralType?.address,
          },
          'PositionCollateral',
        ],
      });

      onSuccess();
    },
  });
}
