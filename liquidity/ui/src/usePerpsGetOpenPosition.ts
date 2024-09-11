import { useImportContract, useImportExtras, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { type BigNumber, ethers } from 'ethers';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

interface PerpsOpenPosition {
  accruedFunding: BigNumber;
  owedInterest: BigNumber;
  positionSize: BigNumber;
  totalPnl: BigNumber;
}

export function usePerpsGetOpenPosition() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: extras } = useImportExtras();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery<PerpsOpenPosition>({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && walletAddress && extras && perpsAccountId),
    queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId, { walletAddress }, 'PerpsGetOpenPosition'],
    queryFn: async () => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && walletAddress && extras && perpsAccountId)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);
      return await PerpsMarketProxy.getOpenPosition(perpsAccountId, extras.eth_perps_market_id);
    },
    throwOnError: (error) => {
      console.error(error);
      return false;
    },
  });
}
