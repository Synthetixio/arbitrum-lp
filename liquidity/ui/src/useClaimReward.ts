import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { fetchWithdrawCollateral } from './fetchWithdrawCollateral';
import { fetchWithdrawCollateralWithPriceUpdate } from './fetchWithdrawCollateralWithPriceUpdate';
import { useErrorParser } from './parseError';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useCoreProxy } from './useCoreProxy';
import { useMulticall } from './useMulticall';
import { usePythERC7412Wrapper } from './usePythERC7412Wrapper';
import { useSelectedAccountId } from './useSelectedAccountId';

export function useClaimReward({
  tokenAddress,
  onSuccess,
}: {
  tokenAddress?: string;
  onSuccess: () => void;
}) {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();

  const { data: CoreProxyContract } = useCoreProxy();

  const errorParser = useErrorParser();
  const { data: priceIds } = useAllPriceFeeds();
  const { data: MulticallContract } = useMulticall();
  const { data: PythERC7412WrapperContract } = usePythERC7412Wrapper();

  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (withdrawAmount: ethers.BigNumber) => {
      if (
        !(
          CoreProxyContract &&
          MulticallContract &&
          PythERC7412WrapperContract &&
          priceIds &&
          connectedChain?.id &&
          walletAddress &&
          wallet?.provider &&
          accountId &&
          tokenAddress
        )
      ) {
        throw 'OMFG';
      }

      if (withdrawAmount.eq(0)) {
        throw new Error('Amount required');
      }

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        wallet,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
      console.log(`freshPriceUpdateTxn`, freshPriceUpdateTxn);

      const freshAccountAvailableCollateral = await fetchAccountAvailableCollateral({
        wallet,
        CoreProxyContract,
        accountId,
        tokenAddress,
      });
      console.log(`freshAccountAvailableCollateral`, freshAccountAvailableCollateral);

      const hasEnoughDeposit = freshAccountAvailableCollateral.gte(withdrawAmount);
      if (!hasEnoughDeposit) {
        throw new Error('Not enough unlocked collateral');
      }

      if (freshPriceUpdateTxn.value) {
        console.log('-> withdrawCollateralWithPriceUpdate');
        await fetchWithdrawCollateralWithPriceUpdate({
          wallet,
          CoreProxyContract,
          MulticallContract,
          accountId,
          tokenAddress,
          withdrawAmount,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
      } else {
        console.log('-> withdrawCollateral');
        await fetchWithdrawCollateral({
          wallet,
          CoreProxyContract,
          accountId,
          tokenAddress,
          withdrawAmount,
        });
      }
      return { priceUpdated: true };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: async ({ priceUpdated }) => {
      if (priceUpdated) {
        await queryClient.invalidateQueries({
          queryKey: [
            connectedChain?.id,
            'PriceUpdateTxn',
            { priceIds: priceIds?.map((p) => p.slice(0, 8)) },
          ],
        });
      }

      // Intentionally do not await
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'AccountCollateral',
          {
            accountId: accountId?.toHexString(),
            tokenAddress,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'AccountAvailableCollateral',
          {
            accountId: accountId?.toHexString(),
            tokenAddress,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'Balance',
          {
            tokenAddress,
            ownerAddress: walletAddress,
          },
        ],
      });

      onSuccess();
    },
  });
}
