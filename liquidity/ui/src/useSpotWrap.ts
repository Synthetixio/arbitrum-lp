import { useErrorParser, useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import type { ethers } from 'ethers';
import { approveToken } from './approveToken';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { fetchSpotWrap } from './fetchSpotWrap';
import { fetchSpotWrapWithPriceUpdate } from './fetchSpotWrapWithPriceUpdate';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useGetPriceData } from './useGetPriceData';
import { useProvider } from './useProvider';
import { useSpotGetSettlementStrategy } from './useSpotGetSettlementStrategy';

export function useSpotWrap({
  onSuccess,
  tokenAddress,
  synthTokenAddress,
  synthMarketId,
  settlementStrategyId,
}: { onSuccess: () => void; tokenAddress?: string; synthTokenAddress?: string; synthMarketId?: string; settlementStrategyId?: string }) {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const [{ connectedChain }] = useSetChain();

  const { chainId } = useSynthetix();
  const provider = useProvider();

  const queryClient = useQueryClient();
  const errorParser = useErrorParser();

  const { data: priceIds } = useAllPriceFeeds();

  const { data: SpotMarketProxyContract } = useImportContract('SpotMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');
  const { data: priceData } = useGetPriceData({ synthMarketId });
  const { data: spotSettlementStrategy } = useSpotGetSettlementStrategy({
    synthMarketId,
    settlementStrategyId,
  });

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useMutation({
    mutationFn: async (amount: ethers.BigNumber) => {
      if (
        !(
          isChainReady &&
          SpotMarketProxyContract?.address &&
          MulticallContract?.address &&
          PythERC7412WrapperContract?.address &&
          walletAddress &&
          wallet &&
          provider &&
          priceData &&
          tokenAddress &&
          synthTokenAddress &&
          synthMarketId
        )
      ) {
        throw 'OMFG';
      }

      if (amount.lte(0)) {
        throw new Error('Amount required');
      }

      const freshBalance = await fetchTokenBalance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress,
      });

      if (freshBalance.lt(amount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress,
        spenderAddress: SpotMarketProxyContract.address,
      });

      if (freshAllowance.lt(amount)) {
        await approveToken({
          wallet,
          tokenAddress,
          spenderAddress: SpotMarketProxyContract.address,
          allowance: amount.sub(freshAllowance),
        });
      }

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds: [spotSettlementStrategy.feedId],
        stalenessTolerance: priceData.strictPriceStalenessTolerance,
      });
      console.log('fetchPriceUpdateTxn', freshPriceUpdateTxn);

      if (freshPriceUpdateTxn.value) {
        console.log('-> fetchSpotWrapWithPriceUpdate');
        await fetchSpotWrapWithPriceUpdate({
          wallet,
          SpotMarketProxyContract,
          MulticallContract,
          synthMarketId,
          amount,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
      } else {
        console.log('-> fetchSpotWrap');
        await fetchSpotWrap({
          wallet,
          SpotMarketProxyContract,
          synthMarketId,
          amount,
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
          queryKey: [chainId, 'PriceUpdateTxn', { priceIds: priceIds?.map((p) => p.slice(0, 8)) }],
        });
      }
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          'Allowance',
          { tokenAddress: tokenAddress, ownerAddress: walletAddress, spenderAddress: SpotMarketProxyContract?.address },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'Balance', { tokenAddress: synthTokenAddress, ownerAddress: walletAddress }],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'Balance', { tokenAddress: tokenAddress, ownerAddress: walletAddress }],
      });

      onSuccess();
    },
  });
}
