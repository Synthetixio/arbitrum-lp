import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchCollateralPrice } from './fetchCollateralPrice';
import { fetchCollateralPriceWithPriceUpdate } from './fetchCollateralPriceWithPriceUpdate';
import { useErrorParser } from './parseError';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useCoreProxy } from './useCoreProxy';
import { useMulticall } from './useMulticall';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';

export function useCollateralPrice({ tokenAddress }: { tokenAddress?: string }) {
  const errorParser = useErrorParser();
  const { data: allPriceFeeds } = useAllPriceFeeds();
  const { data: priceUpdateTxn } = usePriceUpdateTxn(allPriceFeeds);

  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useCoreProxy();
  const { data: MulticallContract } = useMulticall();

  return useQuery({
    enabled: Boolean(
      connectedChain?.id &&
        wallet?.provider &&
        CoreProxyContract &&
        MulticallContract &&
        tokenAddress &&
        priceUpdateTxn
    ),
    queryKey: [connectedChain?.id, 'CollateralPrice', { tokenAddress }],
    queryFn: async () => {
      if (
        !(
          connectedChain?.id &&
          wallet?.provider &&
          CoreProxyContract &&
          MulticallContract &&
          tokenAddress &&
          priceUpdateTxn
        )
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
      } else {
        console.log('-> fetchCollateralPrice');
        return fetchCollateralPrice({
          wallet,
          CoreProxyContract,
          tokenAddress,
        });
      }
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
