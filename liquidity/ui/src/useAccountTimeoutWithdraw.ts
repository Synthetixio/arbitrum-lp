import { useErrorParser, useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function useAccountTimeoutWithdraw() {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && CoreProxyContract?.address && wallet?.provider),
    queryKey: [chainId, 'ConfigUint accountTimeoutWithdraw', { CoreProxy: CoreProxyContract?.address }],
    queryFn: async () => {
      if (!(isChainReady && CoreProxyContract?.address && wallet?.provider)) {
        throw 'OMFG';
      }
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);

      console.time('useAccountTimeoutWithdraw');
      const accountTimeoutWithdraw = await CoreProxy.getConfigUint(ethers.utils.formatBytes32String('accountTimeoutWithdraw'));
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
