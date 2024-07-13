import { useImportExtras } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';

export function useAllPriceFeeds() {
  const [{ connectedChain }] = useSetChain();
  const { data: extras } = useImportExtras();
  return useQuery({
    enabled: Boolean(connectedChain?.id),
    queryKey: [connectedChain?.id, 'AllPriceFeeds'],
    queryFn: async () => {
      if (!(connectedChain?.id && extras)) {
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
