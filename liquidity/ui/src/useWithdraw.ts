import { fetchPriceUpdateTxn, useErrorParser, useImportContract } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import type { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { fetchWithdrawCollateral } from './fetchWithdrawCollateral';
import { fetchWithdrawCollateralWithPriceUpdate } from './fetchWithdrawCollateralWithPriceUpdate';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useProvider } from './useProvider';
import { useSelectedAccountId } from './useSelectedAccountId';

export function useWithdraw({
  tokenAddress,
  onSuccess,
}: {
  tokenAddress?: string;
  onSuccess: () => void;
}) {
  const provider = useProvider();
  const errorParser = useErrorParser();

  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();

  const { data: priceIds } = useAllPriceFeeds();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

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
          provider &&
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
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
      console.log('freshPriceUpdateTxn', freshPriceUpdateTxn);

      const freshAccountAvailableCollateral = await fetchAccountAvailableCollateral({
        wallet,
        CoreProxyContract,
        accountId,
        tokenAddress,
      });
      console.log('freshAccountAvailableCollateral', freshAccountAvailableCollateral);

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
          queryKey: [connectedChain?.id, 'PriceUpdateTxn', { priceIds: priceIds?.map((p) => p.slice(0, 8)) }],
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
