import { useParams } from '@snx-v3/useParams';
import { useImportContract, useImportExtras, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

export function usePerpsGetSettlementStrategy() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: extras } = useImportExtras();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const [params] = useParams();

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(
      isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && walletAddress && extras && perpsAccountId && params.market
    ),
    queryKey: [
      chainId,
      'PerpsGetSettlementStrategy',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address },
      perpsAccountId,
      { walletAddress },
      { market: params.market },
    ],
    queryFn: async () => {
      if (
        !(
          isChainReady &&
          PerpsMarketProxyContract?.address &&
          wallet?.provider &&
          walletAddress &&
          extras &&
          perpsAccountId &&
          params.market
        )
      ) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);

      return await PerpsMarketProxy.getSettlementStrategy(params.market, extras.eth_pyth_settlement_strategy);
    },
    throwOnError: (error) => {
      console.error(error);
      return false;
    },
  });
}
