import { useErrorParser, useSynthetix } from '@synthetixio/react-sdk';
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
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && wallet?.provider && tokenAddress && ownerAddress),
    queryKey: [chainId, 'Balance', { tokenAddress, ownerAddress }],
    queryFn: async () => {
      if (!(isChainReady && wallet?.provider && tokenAddress && ownerAddress)) {
        throw 'OMFG';
      }
      return fetchTokenBalance({ wallet, tokenAddress, ownerAddress });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (balance) => ethers.BigNumber.from(balance),
    refetchInterval: 5 * 60 * 1000,
  });
}
