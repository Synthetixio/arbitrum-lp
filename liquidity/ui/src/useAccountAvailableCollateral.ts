import { useErrorParser, useImportContract } from '@synthetixio/react-sdk';
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
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  return useQuery({
    enabled: Boolean(connectedChain?.id && wallet?.provider && CoreProxyContract && accountId && tokenAddress),
    queryKey: [connectedChain?.id, 'AccountAvailableCollateral', { accountId: accountId?.toHexString(), tokenAddress }],
    queryFn: async () => {
      if (!(connectedChain?.id && wallet?.provider && CoreProxyContract && accountId && tokenAddress)) {
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
