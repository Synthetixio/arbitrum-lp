import { useErrorParser, useImportContract, usePriceUpdateTxn, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchPositionDebt } from './fetchPositionDebt';
import { fetchPositionDebtWithPriceUpdate } from './fetchPositionDebtWithPriceUpdate';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useProvider } from './useProvider';

export function usePositionDebt({
  accountId,
  poolId,
  tokenAddress,
}: {
  accountId?: ethers.BigNumber;
  poolId?: ethers.BigNumber;
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
      isChainReady &&
        CoreProxyContract?.address &&
        MulticallContract?.address &&
        wallet?.provider &&
        accountId &&
        poolId &&
        tokenAddress &&
        priceUpdateTxn
    ),
    queryKey: [
      chainId,
      { CoreProxy: CoreProxyContract?.address, Multicall: MulticallContract?.address },
      { accountId: accountId?.toHexString(), tokenAddress },
      'PositionDebt',
    ],
    queryFn: async () => {
      if (
        !(
          isChainReady &&
          CoreProxyContract?.address &&
          MulticallContract?.address &&
          wallet?.provider &&
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
      }
      console.log('-> fetchPositionDebt');
      return fetchPositionDebt({
        wallet,
        CoreProxyContract,
        accountId,
        poolId,
        tokenAddress,
      });
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
