import { importMulticall3 } from '@snx-v3/contracts';
import { useQuery } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';

export function useMulticall() {
  const [{ connectedChain }] = useSetChain();
  return useQuery({
    enabled: Boolean(connectedChain?.id),
    queryKey: [connectedChain?.id, 'TrustedMulticallForwarder'],
    queryFn: async (): Promise<{ address: string; abi: string }> => {
      if (!connectedChain?.id) {
        throw 'OMFG';
      }
      const { address, abi } = await importMulticall3(parseInt(connectedChain.id, 16), 'main');
      return { address, abi };
    },
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  });
}
