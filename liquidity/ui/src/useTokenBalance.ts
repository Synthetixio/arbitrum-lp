import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchTokenBalance } from './fetchTokenBalance';

export function useTokenBalance({
  tokenAddress,
  ownerAddress,
}: {
  tokenAddress?: string;
  ownerAddress?: string;
}) {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  return useQuery({
    enabled: Boolean(connectedChain?.id && wallet?.provider && tokenAddress && ownerAddress),
    queryKey: [connectedChain?.id, 'Balance', { tokenAddress, ownerAddress }],
    queryFn: async () => {
      if (!(connectedChain?.id && wallet && tokenAddress && ownerAddress)) {
        throw 'OMFG';
      }
      return fetchTokenBalance({ wallet, tokenAddress, ownerAddress });
    },
    select: (balance) => ethers.BigNumber.from(balance),
    refetchInterval: 5 * 60 * 1000,
  });
}
