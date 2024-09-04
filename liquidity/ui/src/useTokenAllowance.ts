import { useErrorParser, useSynthetix } from '@synthetixio/react-sdk';
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
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && wallet?.provider && tokenAddress && ownerAddress && spenderAddress),
    queryKey: [chainId, { tokenAddress, ownerAddress, spenderAddress }, 'Allowance'],
    queryFn: async () => {
      if (!(isChainReady && wallet?.provider && tokenAddress && ownerAddress && spenderAddress)) {
        throw 'OMFG';
      }
      return fetchTokenAllowance({
        wallet,
        tokenAddress,
        ownerAddress,
        spenderAddress,
      });
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
