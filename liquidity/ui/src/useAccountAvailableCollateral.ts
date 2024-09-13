import { useErrorParser, useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';

export function useAccountAvailableCollateral({
  accountId,
  tokenAddress,
}: {
  accountId?: ethers.BigNumber;
  tokenAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && CoreProxyContract?.address && wallet?.provider && accountId && tokenAddress),
    queryKey: [
      chainId,
      'AccountAvailableCollateral',
      { CoreProxy: CoreProxyContract?.address },
      { accountId: accountId?.toHexString(), tokenAddress },
    ],
    queryFn: async () => {
      if (!(isChainReady && CoreProxyContract?.address && wallet?.provider && accountId && tokenAddress)) {
        throw 'OMFG';
      }

      return fetchAccountAvailableCollateral({
        wallet,
        CoreProxyContract,
        accountId,
        tokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountAvailableCollateral) => ethers.BigNumber.from(accountAvailableCollateral),
  });
}
