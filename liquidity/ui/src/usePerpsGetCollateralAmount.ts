import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

const USDx_MARKET_ID = 0;

export function usePerpsGetCollateralAmount() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && perpsAccountId),
    queryKey: [
      chainId,
      'GetPerpsCollateralAmount',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address },
      { collateral: USDx_MARKET_ID },
      perpsAccountId,
    ],
    queryFn: async () => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && perpsAccountId)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      const result = await PerpsMarketProxy.getCollateralAmount(perpsAccountId, USDx_MARKET_ID);
      return result;
    },
  });
}
