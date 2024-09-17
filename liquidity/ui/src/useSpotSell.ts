import { useErrorParser, useImportContract, useImportSystemToken, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import type { ethers } from 'ethers';
import { approveToken } from './approveToken';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { fetchTokenBalance } from './fetchTokenBalance';
import { spotSell } from './spotSell';
import { spotSellWithPriceUpdate } from './spotSellWithPriceUpdate';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useGetPriceData } from './useGetPriceData';
import { useProvider } from './useProvider';
import { useSpotGetSettlementStrategy } from './useSpotGetSettlementStrategy';

export function useSpotSell({
  onSuccess,
  synthMarketId,
  settlementStrategyId,
  synthTokenAddress,
}: { onSuccess: () => void; synthMarketId?: string; settlementStrategyId?: string; synthTokenAddress?: string }) {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  const queryClient = useQueryClient();
  const errorParser = useErrorParser();
  const provider = useProvider();

  const { data: priceIds } = useAllPriceFeeds();
  const { data: SpotMarketProxyContract } = useImportContract('SpotMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');
  const { data: systemToken } = useImportSystemToken();
  const { data: spotSettlementStrategy } = useSpotGetSettlementStrategy({
    synthMarketId,
    settlementStrategyId,
  });
  const { data: priceData } = useGetPriceData({ synthMarketId });

  return useMutation({
    mutationFn: async (amount: ethers.BigNumber) => {
      if (
        !(
          isChainReady &&
          SpotMarketProxyContract?.address &&
          MulticallContract?.address &&
          PythERC7412WrapperContract?.address &&
          walletAddress &&
          wallet?.provider &&
          synthMarketId &&
          synthTokenAddress &&
          systemToken &&
          provider &&
          priceIds &&
          spotSettlementStrategy &&
          priceData
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
        tokenAddress: synthTokenAddress,
      });

      if (freshBalance.lt(amount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress: synthTokenAddress,
        spenderAddress: SpotMarketProxyContract.address,
      });

      if (freshAllowance.lt(amount)) {
        await approveToken({
          wallet,
          tokenAddress: synthTokenAddress,
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
      console.log('freshPriceUpdateTxn', freshPriceUpdateTxn);

      if (freshPriceUpdateTxn.value) {
        console.log('-> spotSellWithPriceUpdate');
        await spotSellWithPriceUpdate({
          wallet,
          SpotMarketProxyContract,
          MulticallContract,
          marketId: synthMarketId,
          amount,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
      } else {
        console.log('-> spotSell');
        await spotSell({
          wallet,
          SpotMarketProxyContract,
          marketId: synthMarketId,
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
        queryKey: [chainId, 'Balance', { tokenAddress: systemToken?.address, ownerAddress: walletAddress }],
      });

      queryClient.invalidateQueries({
        queryKey: [chainId, 'Balance', { tokenAddress: synthTokenAddress, ownerAddress: walletAddress }],
      });

      onSuccess();
    },
  });
}
