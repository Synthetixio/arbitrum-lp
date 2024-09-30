import { useParams } from '@snx-v3/useParams';
import { useImportContract, usePerpsSelectedAccountId, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { type BigNumber, ethers } from 'ethers';
import { useProvider } from './useProvider';

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
  const walletAddress = wallet?.accounts?.[0]?.address;
  const [params] = useParams();
  const provider = useProvider();
  const perpsAccountId = usePerpsSelectedAccountId({ provider, walletAddress, perpsAccountId: params.perpsAccountId });
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery<PerpsOrder>({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && perpsAccountId),
    queryKey: [chainId, 'PerpsGetOrder', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
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
