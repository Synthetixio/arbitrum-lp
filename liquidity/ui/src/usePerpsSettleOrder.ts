import { useParams } from '@snx-v3/useParams';
import { useErrorParser, useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { fetchStrictPriceUpdateTxn } from './fetchStrictPriceUpdateTxn';
import { settleOrder } from './settleOrder';
import { settleOrderWithPriceUpdate } from './settleOrderWithPriceUpdate';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { usePerpsGetOrder } from './usePerpsGetOrder';
import { usePerpsGetSettlementStrategy } from './usePerpsGetSettlementStrategy';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';
import { useProvider } from './useProvider';

export function usePerpsSettleOrder() {
  const [params] = useParams();
  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: priceIds } = useAllPriceFeeds();
  const { data: settlementStrategy } = usePerpsGetSettlementStrategy();
  const { data: order } = usePerpsGetOrder();

  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  const provider = useProvider();
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
          { market: params.market },
          { PerpsMarketProxy: PerpsMarketProxyContract?.address },
          perpsAccountId,
          { walletAddress },
          'PerpsGetOpenPosition',
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId, 'PerpsGetOrder'],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId, 'PerpsGetAvailableMargin'],
      });
    },
  });
}
