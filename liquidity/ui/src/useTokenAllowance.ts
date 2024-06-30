import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { useErrorParser } from './parseError';

export function useTokenAllowance({
  tokenAddress,
  ownerAddress,
  spenderAddress,
}: {
  tokenAddress?: string;
  ownerAddress?: string;
  spenderAddress?: string;
}) {
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  return useQuery({
    enabled: Boolean(
      connectedChain?.id && wallet?.provider && tokenAddress && ownerAddress && spenderAddress
    ),
    queryKey: [connectedChain?.id, 'Allowance', { tokenAddress, ownerAddress, spenderAddress }],
    queryFn: async () => {
      if (!(connectedChain?.id && wallet && tokenAddress && ownerAddress && spenderAddress)) {
        throw 'OMFG';
      }
      return fetchTokenAllowance({ wallet, tokenAddress, ownerAddress, spenderAddress });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (allowance) => ethers.BigNumber.from(allowance),
    refetchInterval: 5 * 60 * 1000,
  });
}
