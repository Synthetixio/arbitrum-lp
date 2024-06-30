import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchMintUsd } from './fetchMintUsd';
import { fetchMintUsdWithPriceUpdate } from './fetchMintUsdWithPriceUpdate';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { useErrorParser } from './parseError';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useCoreProxy } from './useCoreProxy';
import { useMulticall } from './useMulticall';
import { usePythERC7412Wrapper } from './usePythERC7412Wrapper';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';
import { useSystemToken } from './useSystemToken';

export function useMintUsd() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: systemToken } = useSystemToken();

  const { data: CoreProxyContract } = useCoreProxy();

  const errorParser = useErrorParser();
  const { data: priceIds } = useAllPriceFeeds();
  const { data: MulticallContract } = useMulticall();
  const { data: PythERC7412WrapperContract } = usePythERC7412Wrapper();

  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (mintUsdAmount: ethers.BigNumber) => {
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

      if (mintUsdAmount.eq(0)) {
        throw new Error('Amount required');
      }

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        wallet,
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
          'PositionDebt',
          { accountId: accountId?.toHexString(), tokenAddress: collateralType?.address },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'AccountAvailableCollateral',
          {
            accountId: accountId?.toHexString(),
            tokenAddress: systemToken?.address,
          },
        ],
      });
    },
  });
}
