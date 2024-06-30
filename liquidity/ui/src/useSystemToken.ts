import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { useErrorParser } from './parseError';
import { useUSDProxy } from './useUSDProxy';

export function useSystemToken() {
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: USDProxyContract } = useUSDProxy();
  return useQuery({
    enabled: Boolean(connectedChain?.id && wallet?.provider && USDProxyContract),
    queryKey: [connectedChain?.id, 'SystemToken'],
    queryFn: async () => {
      if (!(connectedChain?.id && wallet && USDProxyContract)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const USDProxy = new ethers.Contract(
        USDProxyContract.address,
        USDProxyContract.abi,
        provider
      );
      return {
        address: USDProxyContract.address,
        symbol: await USDProxy.symbol(),
        name: await USDProxy.name(),
        decimals: await USDProxy.decimals(),
      };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: ({ address, symbol, name, decimals }) => ({ address, symbol, name, decimals }),
  });
}
