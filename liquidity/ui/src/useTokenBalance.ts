import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchTokenBalance } from './fetchTokenBalance';

export function useTokenBalance({
  tokenAddress,
  ownerAddress,
}: {
  tokenAddress: string;
  ownerAddress: string;
}) {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  return useQuery({
    enabled: Boolean(connectedChain?.id && wallet?.provider && tokenAddress && ownerAddress),
    queryKey: [connectedChain?.id, 'Balance', { tokenAddress, ownerAddress }],
    queryFn: async () => {
      if (!(connectedChain?.id && wallet?.provider && tokenAddress && ownerAddress)) {
        throw 'OMFG';
      }
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      return fetchTokenBalance({ provider, tokenAddress, ownerAddress });
    },
    refetchInterval: 60_000,
  });
}
