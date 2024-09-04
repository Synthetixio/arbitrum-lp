import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

interface MarketMetadata {
  name: string;
  symbol: string;
  [key: number]: string;
}

export function useMarketMetadata(marketId: number) {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery<MarketMetadata>({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && marketId),
    queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, marketId, 'MarketMetadata'],
    queryFn: async () => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && marketId)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      return PerpsMarketProxy.metadata(marketId);
    },
  });
}
