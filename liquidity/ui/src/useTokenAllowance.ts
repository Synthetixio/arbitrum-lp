import { fetchTokenAllowance, useErrorParser, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { useProvider } from './useProvider';

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
  const provider = useProvider();

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && provider && tokenAddress && ownerAddress && spenderAddress),
    queryKey: [chainId, 'Allowance', { tokenAddress, ownerAddress, spenderAddress }],
    queryFn: async () => {
      if (!(isChainReady && provider && tokenAddress && ownerAddress && spenderAddress)) {
        throw 'OMFG';
      }
      return fetchTokenAllowance({
        provider,
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
