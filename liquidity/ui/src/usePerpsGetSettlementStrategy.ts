import { useParams } from '@snx-v3/useParams';
import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function usePerpsGetSettlementStrategy({ settlementStrategyId }: { settlementStrategyId?: string }) {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const [params] = useParams();

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && settlementStrategyId && params.market),
    queryKey: [
      chainId,
      'PerpsGetSettlementStrategy',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address },
      { market: params.market, settlementStrategyId },
    ],
    queryFn: async () => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && settlementStrategyId && params.market)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);

      return await PerpsMarketProxy.getSettlementStrategy(params.market, settlementStrategyId);
    },
    throwOnError: (error) => {
      console.error(error);
      return false;
    },
  });
}
