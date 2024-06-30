import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { useErrorParser } from './parseError';
import { useCoreProxy } from './useCoreProxy';

export function useAccountLastInteraction({ accountId }: { accountId?: ethers.BigNumber }) {
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useCoreProxy();

  return useQuery({
    enabled: Boolean(connectedChain?.id && wallet?.provider && CoreProxyContract && accountId),
    queryKey: [
      connectedChain?.id,
      'AccountLastInteraction',
      { accountId: accountId?.toHexString() },
    ],
    queryFn: async () => {
      if (!(connectedChain?.id && wallet?.provider && CoreProxyContract && accountId)) {
        throw 'OMFG';
      }
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const CoreProxy = new ethers.Contract(
        CoreProxyContract.address,
        CoreProxyContract.abi,
        provider
      );

      console.time('useAccountLastInteraction');
      const accountLastInteraction = CoreProxy.getAccountLastInteraction(accountId);
      console.timeEnd('useAccountLastInteraction');
      return accountLastInteraction;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountLastInteraction) => ethers.BigNumber.from(accountLastInteraction),
    refetchInterval: 5 * 60 * 1000,
  });
}
