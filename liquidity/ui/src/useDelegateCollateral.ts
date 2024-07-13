import { fetchPriceUpdateTxn, useErrorParser, useImportContract } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import type { ethers } from 'ethers';
import { delegateCollateral } from './delegateCollateral';
import { delegateCollateralWithPriceUpdate } from './delegateCollateralWithPriceUpdate';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { fetchPositionCollateral } from './fetchPositionCollateral';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useProvider } from './useProvider';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function useDelegateCollateral({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const provider = useProvider();
  const errorParser = useErrorParser();

  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  const { data: priceIds } = useAllPriceFeeds();
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (delegateAmountDelta: ethers.BigNumber) => {
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
          poolId &&
          collateralType
        )
      ) {
        throw 'OMFG';
      }

      if (delegateAmountDelta.eq(0)) {
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
        tokenAddress: collateralType.address,
      });
      console.log('freshAccountAvailableCollateral', freshAccountAvailableCollateral);

      const hasEnoughDeposit = freshAccountAvailableCollateral.gte(delegateAmountDelta);
      if (!hasEnoughDeposit) {
        throw new Error('Not enough deposit');
      }

      const freshPositionCollateral = await fetchPositionCollateral({
        wallet,
        CoreProxyContract,
        accountId,
        poolId,
        tokenAddress: collateralType.address,
      });
      console.log('freshPositionCollateral', freshPositionCollateral);

      const delegateAmount = freshPositionCollateral.add(delegateAmountDelta);
      console.log('delegateAmount', delegateAmount);

      if (freshPriceUpdateTxn.value) {
        console.log('-> delegateCollateralWithPriceUpdate');
        await delegateCollateralWithPriceUpdate({
          wallet,
          CoreProxyContract,
          MulticallContract,
          accountId,
          poolId,
          tokenAddress: collateralType.address,
          delegateAmount,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
      } else {
        console.log('-> delegateCollateral');
        await delegateCollateral({
          wallet,
          CoreProxyContract,
          accountId,
          poolId,
          tokenAddress: collateralType.address,
          delegateAmount,
        });
      }
      return { priceUpdated: true };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error).then();
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
            tokenAddress: collateralType?.address,
          },
        ],
      });
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
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'PositionDebt',
          {
            accountId: accountId?.toHexString(),
            tokenAddress: collateralType?.address,
          },
        ],
      });

      onSuccess();
    },
  });
}
