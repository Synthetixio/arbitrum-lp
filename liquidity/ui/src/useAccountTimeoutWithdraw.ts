import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { useErrorParser } from './parseError';
import { useCoreProxy } from './useCoreProxy';

export function useAccountTimeoutWithdraw() {
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useCoreProxy();

  return useQuery({
    enabled: Boolean(connectedChain?.id && wallet?.provider && CoreProxyContract),
    queryKey: [connectedChain?.id, 'ConfigUint accountTimeoutWithdraw'],
    queryFn: async () => {
      if (!(connectedChain?.id && wallet?.provider && CoreProxyContract)) {
        throw 'OMFG';
      }
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const CoreProxy = new ethers.Contract(
        CoreProxyContract.address,
        CoreProxyContract.abi,
        provider
      );

      console.time('useAccountTimeoutWithdraw');
      const accountTimeoutWithdraw = await CoreProxy.getConfigUint(
        ethers.utils.formatBytes32String('accountTimeoutWithdraw')
      );
      console.timeEnd('useAccountTimeoutWithdraw');
      return accountTimeoutWithdraw;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountTimeoutWithdraw) => ethers.BigNumber.from(accountTimeoutWithdraw),
  });
}
