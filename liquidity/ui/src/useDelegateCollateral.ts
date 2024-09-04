import { fetchPriceUpdateTxn, useErrorParser, useImportContract, useSynthetix } from '@synthetixio/react-sdk';
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
  const { chainId } = useSynthetix();
  const provider = useProvider();
  const errorParser = useErrorParser();

  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  const { data: priceIds } = useAllPriceFeeds();
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

  const queryClient = useQueryClient();
  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);
  return useMutation({
    retry: false,
    mutationFn: async (delegateAmountDelta: ethers.BigNumber) => {
      if (
        !(
          isChainReady &&
          CoreProxyContract &&
          MulticallContract &&
          PythERC7412WrapperContract &&
          priceIds &&
          wallet &&
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
          queryKey: [chainId, 'PriceUpdateTxn', { priceIds: priceIds?.map((p) => p.slice(0, 8)) }],
        });
      }

      // Intentionally do not await
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          { CoreProxy: CoreProxyContract?.address, Multicall: MulticallContract?.address },
          {
            accountId: accountId?.toHexString(),
            tokenAddress: collateralType?.address,
          },
          'AccountCollateral',
        ],
      });
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
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          { CoreProxy: CoreProxyContract?.address, Multicall: MulticallContract?.address },
          {
            accountId: accountId?.toHexString(),
            tokenAddress: collateralType?.address,
          },
          'PositionDebt',
        ],
      });

      onSuccess();
    },
  });
}
