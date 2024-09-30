import { useErrorParser, useImportContract, usePriceUpdateTxn, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchAccountCollateral } from './fetchAccountCollateral';
import { fetchAccountCollateralWithPriceUpdate } from './fetchAccountCollateralWithPriceUpdate';
import { useProvider } from './useProvider';

export function useAccountCollateral({
  accountId,
  tokenAddress,
}: {
  accountId?: ethers.BigNumber;
  tokenAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const provider = useProvider();
  const errorParser = useErrorParser();

  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: MulticallContract } = useImportContract('Multicall');

  const { data: priceUpdateTxn } = usePriceUpdateTxn({ provider });

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(
      isChainReady &&
        CoreProxyContract?.address &&
        MulticallContract?.address &&
        wallet?.provider &&
        accountId &&
        tokenAddress &&
        priceUpdateTxn
    ),
    queryKey: [
      chainId,
      'AccountCollateral',
      { CoreProxy: CoreProxyContract?.address, Multicall: MulticallContract?.address },
      { accountId: accountId?.toHexString(), tokenAddress },
    ],
    queryFn: async () => {
      if (
        !(
          isChainReady &&
          CoreProxyContract?.address &&
          MulticallContract?.address &&
          wallet?.provider &&
          accountId &&
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
        console.log('-> fetchAccountCollateralWithPriceUpdate');
        return fetchAccountCollateralWithPriceUpdate({
          wallet,
          CoreProxyContract,
          MulticallContract,
          accountId,
          tokenAddress,
          priceUpdateTxn,
        });
      }
      console.log('-> fetchAccountCollateral');
      return fetchAccountCollateral({
        wallet,
        CoreProxyContract,
        accountId,
        tokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountCollateral) => ({
      totalAssigned: ethers.BigNumber.from(accountCollateral.totalAssigned),
      totalDeposited: ethers.BigNumber.from(accountCollateral.totalDeposited),
      totalLocked: ethers.BigNumber.from(accountCollateral.totalLocked),
    }),
    retry: 5,
    retryDelay: (attempt) => 2 ** attempt * 1000,
  });
}
