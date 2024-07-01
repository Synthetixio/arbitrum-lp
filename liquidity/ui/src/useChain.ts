import { useQuery } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';

export function useChain() {
  const [{ chains, connectedChain }] = useSetChain();

  return useQuery({
    queryKey: ['chain'],
    queryFn: () => {
      if (connectedChain?.id) {
        return chains.find((chain) => chain.id === connectedChain?.id) || chains[0];
      }
      return chains[0];
    },
    initialData: chains[0],
  });
}
