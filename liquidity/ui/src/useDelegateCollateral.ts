import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { delegateCollateral } from './delegateCollateral';
import { delegateCollateralWithPriceUpdate } from './delegateCollateralWithPriceUpdate';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { fetchPositionCollateral } from './fetchPositionCollateral';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { useErrorParser } from './parseError';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useCoreProxy } from './useCoreProxy';
import { useMulticall } from './useMulticall';
import { usePythERC7412Wrapper } from './usePythERC7412Wrapper';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function useDelegateCollateral({ onSuccess }: { onSuccess: () => void }) {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: CoreProxyContract } = useCoreProxy();

  const errorParser = useErrorParser();
  const { data: priceIds } = useAllPriceFeeds();
  const { data: MulticallContract } = useMulticall();
  const { data: PythERC7412WrapperContract } = usePythERC7412Wrapper();

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
          wallet?.provider &&
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
        tokenAddress: collateralType.address,
      });
      console.log(`freshAccountAvailableCollateral`, freshAccountAvailableCollateral);

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
      console.log(`freshPositionCollateral`, freshPositionCollateral);

      const delegateAmount = freshPositionCollateral.add(delegateAmountDelta);
      console.log(`delegateAmount`, delegateAmount);

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
          { accountId: accountId?.toHexString(), tokenAddress: collateralType?.address },
        ],
      });

      onSuccess();
    },
  });
}
