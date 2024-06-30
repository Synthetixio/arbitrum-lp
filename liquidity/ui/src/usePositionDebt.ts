import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchPositionDebt } from './fetchPositionDebt';
import { fetchPositionDebtWithPriceUpdate } from './fetchPositionDebtWithPriceUpdate';
import { useErrorParser } from './parseError';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useCoreProxy } from './useCoreProxy';
import { useMulticall } from './useMulticall';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';

export function usePositionDebt({
  accountId,
  poolId,
  tokenAddress,
}: {
  accountId?: ethers.BigNumber;
  poolId?: ethers.BigNumber;
  tokenAddress?: string;
}) {
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
        accountId &&
        poolId &&
        tokenAddress &&
        priceUpdateTxn
    ),
    queryKey: [
      connectedChain?.id,
      'PositionDebt',
      { accountId: accountId?.toHexString(), tokenAddress },
    ],
    queryFn: async () => {
      if (
        !(
          connectedChain?.id &&
          wallet?.provider &&
          CoreProxyContract &&
          MulticallContract &&
          accountId &&
          poolId &&
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
        accountId,
        tokenAddress,
        priceUpdateTxn,
      });

      if (priceUpdateTxn.value) {
        console.log('-> fetchPositionDebtWithPriceUpdate');
        return fetchPositionDebtWithPriceUpdate({
          wallet,
          CoreProxyContract,
          MulticallContract,
          accountId,
          poolId,
          tokenAddress,
          priceUpdateTxn,
        });
      } else {
        console.log('-> fetchPositionDebt');
        return fetchPositionDebt({
          wallet,
          CoreProxyContract,
          accountId,
          poolId,
          tokenAddress,
        });
      }
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (positionDebt) => ethers.BigNumber.from(positionDebt),
    retry: 5,
    retryDelay: (attempt) => 2 ** attempt * 1000,
  });
}
