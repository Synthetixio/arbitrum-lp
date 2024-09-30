import { useParams } from '@snx-v3/useParams';
import { useAllPriceFeeds, useErrorParser, useImportContract, usePerpsSelectedAccountId, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { fetchStrictPriceUpdateTxn } from './fetchStrictPriceUpdateTxn';
import { settleOrder } from './settleOrder';
import { settleOrderWithPriceUpdate } from './settleOrderWithPriceUpdate';
import { usePerpsGetOrder } from './usePerpsGetOrder';
import { usePerpsGetSettlementStrategy } from './usePerpsGetSettlementStrategy';
import { useProvider } from './useProvider';

export function usePerpsSettleOrder({ settlementStrategyId }: { settlementStrategyId?: string }) {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const [params] = useParams();
  const provider = useProvider();
  const perpsAccountId = usePerpsSelectedAccountId({ provider, walletAddress, perpsAccountId: params.perpsAccountId });
  const { data: priceIds } = useAllPriceFeeds();
  const { data: settlementStrategy } = usePerpsGetSettlementStrategy({ settlementStrategyId });
  const { data: order } = usePerpsGetOrder();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  const queryClient = useQueryClient();
  const errorParser = useErrorParser();

  return useMutation({
    retry: false,
    mutationFn: async () => {
      if (
        !(
          isChainReady &&
          perpsAccountId &&
          params.market &&
          priceIds &&
          settlementStrategy &&
          order &&
          PerpsMarketProxyContract?.address &&
          MulticallContract?.address &&
          PythERC7412WrapperContract?.address &&
          walletAddress &&
          wallet?.provider &&
          provider
        )
      ) {
        throw 'OMFG';
      }

      const freshStrictPriceUpdateTxn = await fetchStrictPriceUpdateTxn({
        commitmentTime: order.commitmentTime,
        feedId: settlementStrategy.feedId,
        commitmentPriceDelay: settlementStrategy.commitmentPriceDelay,
        PythERC7412WrapperContract,
      });

      if (freshStrictPriceUpdateTxn.value) {
        console.log('-> settleOrderWithPriceUpdate');
        await settleOrderWithPriceUpdate({
          wallet,
          PerpsMarketProxyContract,
          MulticallContract,
          perpsAccountId,
          priceUpdateTxn: freshStrictPriceUpdateTxn,
        });
      } else {
        console.log('-> settleOrder');
        await settleOrder({
          wallet,
          PerpsMarketProxyContract,
          perpsAccountId,
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
          'PerpsGetOpenPosition',
          { market: params.market },
          { PerpsMarketProxy: PerpsMarketProxyContract?.address },
          perpsAccountId,
          { walletAddress },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'PerpsGetOrder', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'Perps GetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
    },
  });
}
