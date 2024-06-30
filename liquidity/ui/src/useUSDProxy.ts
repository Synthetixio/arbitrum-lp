import { importUSDProxy } from '@snx-v3/contracts';
import { useQuery } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';

export function useUSDProxy() {
  const [{ connectedChain }] = useSetChain();
  return useQuery({
    enabled: Boolean(connectedChain?.id),
    queryKey: [connectedChain?.id, 'USDProxy'],
    queryFn: async (): Promise<{ address: string; abi: string }> => {
      if (!connectedChain?.id) {
        throw 'OMFG';
      }
      const { address, abi } = await importUSDProxy(parseInt(connectedChain.id, 16), 'main');
      return { address, abi };
    },
    staleTime: 60 * 60 * 1000,
  });
}
