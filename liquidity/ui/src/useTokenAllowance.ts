import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchTokenAllowance } from './fetchTokenAllowance';

export function useTokenAllowance({
  tokenAddress,
  ownerAddress,
  spenderAddress,
}: {
  tokenAddress?: string;
  ownerAddress?: string;
  spenderAddress?: string;
}) {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  return useQuery({
    enabled: Boolean(
      connectedChain?.id && wallet?.provider && tokenAddress && ownerAddress && spenderAddress
    ),
    queryKey: [connectedChain?.id, 'Allowance', { tokenAddress, ownerAddress, spenderAddress }],
    queryFn: async () => {
      if (
        !(connectedChain?.id && wallet?.provider && tokenAddress && ownerAddress && spenderAddress)
      ) {
        throw 'OMFG';
      }
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      return fetchTokenAllowance({ provider, tokenAddress, ownerAddress, spenderAddress });
    },
    select: (allowance) => ethers.BigNumber.from(allowance),
    refetchInterval: 60_000,
  });
}
