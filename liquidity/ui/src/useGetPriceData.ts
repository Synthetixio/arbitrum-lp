import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

interface GetPriceData {
  buyFeedId: string;
  sellFeedId: string;
  strictPriceStalenessTolerance: ethers.BigNumber;
}

export function useGetPriceData({ synthMarketId }: { synthMarketId?: string }) {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: SpotMarketProxyContract } = useImportContract('SpotMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery<GetPriceData>({
    enabled: Boolean(isChainReady && SpotMarketProxyContract?.address && wallet?.provider && synthMarketId),
    queryKey: [chainId, 'GetPriceData', { SpotMarketProxy: SpotMarketProxyContract?.address }, synthMarketId],
    queryFn: async () => {
      if (!(isChainReady && SpotMarketProxyContract?.address && wallet?.provider && synthMarketId)) {
        throw new Error('OMFG');
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const SpotMarketProxy = new ethers.Contract(SpotMarketProxyContract.address, SpotMarketProxyContract.abi, provider);
      const priceData = await SpotMarketProxy.getPriceData(synthMarketId);
      console.log({ priceData });
      return priceData;
    },
  });
}
