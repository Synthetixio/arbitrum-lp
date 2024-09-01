import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function useMarkets() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery<number[]>({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && walletAddress && wallet?.provider),
    queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, 'Markets', { ownerAddress: walletAddress }],
    queryFn: async () => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && walletAddress && wallet?.provider)) {
        throw new Error('OMFG');
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);

      const markets = await PerpsMarketProxy.getMarkets();
      return markets.map((bigNumber: ethers.BigNumber) => bigNumber.toNumber());
    },
  });
}
