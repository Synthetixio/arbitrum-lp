import { useErrorParser, useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

interface MarketSummary {
  skew: ethers.BigNumber;
  size: ethers.BigNumber;
  maxOpenInterest: ethers.BigNumber;
  currentFundingRate: ethers.BigNumber;
  currentFundingVelocity: ethers.BigNumber;
  indexPrice: ethers.BigNumber;
  [key: number]: ethers.BigNumber;
}

export function useMarketSummary(marketId: ethers.BigNumber) {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const errorParser = useErrorParser();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery<MarketSummary>({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && marketId),
    queryKey: [chainId, 'MarketSummary', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, { marketId: marketId.toString() }],
    queryFn: async () => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && marketId)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      return PerpsMarketProxy.getMarketSummary(marketId);
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
