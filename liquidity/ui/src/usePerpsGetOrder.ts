import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { type BigNumber, ethers } from 'ethers';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

interface PerpsOrder {
  commitmentTime: BigNumber;
  request: {
    marketId: BigNumber;
    accountId: BigNumber;
    sizeDelta: BigNumber;
    settlementStrategyId: BigNumber;
    acceptablePrice: BigNumber;
    trackingCode: string;
    referrer: string;
  };
}

export function usePerpsGetOrder() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery<PerpsOrder>({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && perpsAccountId),
    queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId, 'PerpsGetOrder'],
    queryFn: async () => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && perpsAccountId)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      return await PerpsMarketProxy.getOrder(perpsAccountId);
    },
    throwOnError: (error) => {
      console.error(error);
      return false;
    },
  });
}
