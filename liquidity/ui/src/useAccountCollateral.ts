import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { useErrorParser } from './parseError';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useCoreProxy } from './useCoreProxy';
import { useMulticall } from './useMulticall';
import { fetchAccountCollateral } from './fetchAccountCollateral';

export function useAccountCollateral({
  accountId,
  tokenAddress,
}: {
  accountId?: string;
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
        tokenAddress &&
        priceUpdateTxn
    ),
    queryKey: [connectedChain?.id, 'AccountCollateral', { accountId, tokenAddress }],
    queryFn: async () => {
      if (
        !(
          connectedChain?.id &&
          wallet?.provider &&
          CoreProxyContract &&
          MulticallContract &&
          accountId &&
          tokenAddress &&
          priceUpdateTxn
        )
      ) {
        throw 'OMFG';
      }
      return fetchAccountCollateral({
        wallet,
        CoreProxyContract,
        MulticallContract,
        accountId,
        tokenAddress,
        priceUpdateTxn,
        errorParser,
      });
    },
    select: (accountCollateral) => ({
      totalAssigned: ethers.BigNumber.from(accountCollateral.totalAssigned),
      totalDeposited: ethers.BigNumber.from(accountCollateral.totalDeposited),
      totalLocked: ethers.BigNumber.from(accountCollateral.totalLocked),
    }),
  });
}
