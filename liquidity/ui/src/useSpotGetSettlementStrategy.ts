import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function useSpotGetSettlementStrategy({
  synthMarketId,
  settlementStrategyId,
}: { synthMarketId?: string; settlementStrategyId?: string }) {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: SpotMarketProxyContract } = useImportContract('SpotMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && SpotMarketProxyContract?.address && wallet?.provider && synthMarketId && settlementStrategyId),
    queryKey: [
      chainId,
      'SpotGetSettlementStrategy',
      { SpotMarketProxy: SpotMarketProxyContract?.address },
      { synthMarketId, settlementStrategyId },
    ],
    queryFn: async () => {
      if (!(isChainReady && SpotMarketProxyContract?.address && wallet?.provider && synthMarketId && settlementStrategyId)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const SpotMarketProxy = new ethers.Contract(SpotMarketProxyContract.address, SpotMarketProxyContract.abi, provider);

      return await SpotMarketProxy.getSettlementStrategy(synthMarketId, settlementStrategyId);
    },
    throwOnError: (error) => {
      console.error(error);
      return false;
    },
  });
}
