import { useImportExtras, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';

export function useAllPriceFeeds() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const { data: extras } = useImportExtras();

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && extras),
    queryKey: [chainId, 'AllPriceFeeds'],
    queryFn: async () => {
      if (!(isChainReady && extras)) {
        throw 'OMFG';
      }
      return Object.entries(extras)
        .filter(
          ([key, value]) =>
            String(value).length === 66 && (key.startsWith('pyth_feed_id_') || (key.startsWith('pyth') && key.endsWith('FeedId')))
        )
        .map(([, value]) => value as string);
    },
    staleTime: 60 * 60 * 1000,
  });
}
