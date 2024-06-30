import { importCoreProxy } from '@snx-v3/contracts';
import { useQuery } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';

export function useCoreProxy() {
  const [{ connectedChain }] = useSetChain();
  return useQuery({
    enabled: Boolean(connectedChain?.id),
    queryKey: [connectedChain?.id, 'CoreProxy'],
    queryFn: async (): Promise<{ address: string; abi: string }> => {
      if (!connectedChain?.id) {
        throw 'OMFG';
      }
      const { address, abi } = await importCoreProxy(parseInt(connectedChain.id, 16), 'main');
      return { address, abi };
    },
    staleTime: 60 * 60 * 1000,
  });
}
