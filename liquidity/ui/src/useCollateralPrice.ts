import { useErrorParser, useImportContract, usePriceUpdateTxn, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchCollateralPrice } from './fetchCollateralPrice';
import { fetchCollateralPriceWithPriceUpdate } from './fetchCollateralPriceWithPriceUpdate';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useProvider } from './useProvider';

export function useCollateralPrice({
  tokenAddress,
}: {
  tokenAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const provider = useProvider();
  const errorParser = useErrorParser();

  const { data: priceIds } = useAllPriceFeeds();
  const { data: priceUpdateTxn } = usePriceUpdateTxn({ provider, priceIds });

  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: MulticallContract } = useImportContract('Multicall');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(
      isChainReady && CoreProxyContract?.address && MulticallContract?.address && wallet?.provider && tokenAddress && priceUpdateTxn
    ),
    queryKey: [
      chainId,
      { CoreProxy: CoreProxyContract?.address, Multicall: MulticallContract?.address },
      { tokenAddress },
      'CollateralPrice',
    ],
    queryFn: async () => {
      if (
        !(isChainReady && CoreProxyContract?.address && MulticallContract?.address && wallet?.provider && tokenAddress && priceUpdateTxn)
      ) {
        throw 'OMFG';
      }
      console.log({
        wallet,
        CoreProxyContract,
        MulticallContract,
        tokenAddress,
        priceUpdateTxn,
      });

      if (priceUpdateTxn.value) {
        console.log('-> fetchCollateralPriceWithPriceUpdate');
        return fetchCollateralPriceWithPriceUpdate({
          wallet,
          CoreProxyContract,
          MulticallContract,
          tokenAddress,
          priceUpdateTxn,
        });
      }
      console.log('-> fetchCollateralPrice');
      return fetchCollateralPrice({
        wallet,
        CoreProxyContract,
        tokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (collateralPrice) => ethers.BigNumber.from(collateralPrice),
    retry: 5,
    retryDelay: (attempt) => 2 ** attempt * 1000,
  });
}
