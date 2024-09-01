import { useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';

export function useChain() {
  const { chainId } = useSynthetix();
  const [{ chains, connectedChain }] = useSetChain();

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady),
    queryKey: ['chain', chainId],
    queryFn: () => {
      if (isChainReady) {
        return chains.find((chain) => Number.parseInt(chain.id, 16) === chainId) || chains[0];
      }
      return chains[0];
    },
    initialData: chains[0],
  });
}
