import { fetchPriceUpdateTxn, useErrorParser, useImportContract, useImportSystemToken, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import type { ethers } from 'ethers';
import { fetchMintUsd } from './fetchMintUsd';
import { fetchMintUsdWithPriceUpdate } from './fetchMintUsdWithPriceUpdate';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useProvider } from './useProvider';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function useMintUsd({ onSuccess }: { onSuccess: () => void }) {
  const { chainId } = useSynthetix();
  const provider = useProvider();
  const errorParser = useErrorParser();

  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: systemToken } = useImportSystemToken();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  const { data: priceIds } = useAllPriceFeeds();
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (mintUsdAmount: ethers.BigNumber) => {
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

      if (mintUsdAmount.eq(0)) {
        throw new Error('Amount required');
      }

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
      console.log({ freshPriceUpdateTxn });

      if (freshPriceUpdateTxn.value) {
        console.log('-> mintUsdWithPriceUpdate');
        await fetchMintUsdWithPriceUpdate({
          wallet,
          CoreProxyContract,
          MulticallContract,
          accountId,
          poolId,
          tokenAddress: collateralType.address,
          mintUsdAmount,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
      } else {
        console.log('-> mintUsd');
        await fetchMintUsd({
          wallet,
          CoreProxyContract,
          accountId,
          poolId,
          tokenAddress: collateralType.address,
          mintUsdAmount,
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
          'PositionDebt',
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          { CoreProxy: CoreProxyContract?.address },
          {
            accountId: accountId?.toHexString(),
            tokenAddress: systemToken?.address,
          },
          'AccountAvailableCollateral',
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, { CoreProxy: CoreProxyContract?.address }, { accountId: accountId?.toHexString() }, 'AccountLastInteraction'],
      });

      onSuccess();
    },
  });
}
