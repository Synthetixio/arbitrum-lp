import { useErrorParser, useImportContract, usePriceUpdateTxn, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import type { ethers } from 'ethers';
import { fetchMarketSummary } from './fetchMarketSummary';
import { fetchMarketSummaryWithPriceUpdate } from './fetchMarketSummaryWithPriceUpdate';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useProvider } from './useProvider';

interface MarketSummary {
  skew: ethers.BigNumber;
  size: ethers.BigNumber;
  maxOpenInterest: ethers.BigNumber;
  currentFundingRate: ethers.BigNumber;
  currentFundingVelocity: ethers.BigNumber;
  indexPrice: ethers.BigNumber;
}

export function useMarketSummary(marketId: ethers.BigNumber) {
  const { chainId } = useSynthetix();
  const provider = useProvider();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const errorParser = useErrorParser();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: priceIds } = useAllPriceFeeds();
  const { data: priceUpdateTxn } = usePriceUpdateTxn({ provider, priceIds });

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery<MarketSummary>({
    enabled: Boolean(
      isChainReady && PerpsMarketProxyContract?.address && MulticallContract?.address && wallet?.provider && marketId && priceUpdateTxn
    ),
    queryKey: [
      chainId,
      'MarketSummary',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address, Multicall: MulticallContract?.address },
      { marketId: marketId.toString() },
    ],
    queryFn: async () => {
      if (
        !(isChainReady && PerpsMarketProxyContract?.address && MulticallContract?.address && wallet?.provider && marketId && priceUpdateTxn)
      ) {
        throw 'OMFG';
      }

      if (priceUpdateTxn.value) {
        console.log('-> fetchMarketSummaryWithPriceUpdate');
        return await fetchMarketSummaryWithPriceUpdate({ wallet, PerpsMarketProxyContract, MulticallContract, marketId, priceUpdateTxn });
      }
      console.log('-> fetchMarketSummary');
      return await fetchMarketSummary({ wallet, PerpsMarketProxyContract, marketId });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
