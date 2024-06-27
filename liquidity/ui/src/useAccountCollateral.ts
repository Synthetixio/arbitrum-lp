import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { useErrorParser } from './parseError';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useCoreProxy } from './useCoreProxy';
import { useMulticall } from './useMulticall';

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
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const CoreProxy = new ethers.Contract(
        CoreProxyContract.address,
        CoreProxyContract.abi,
        provider
      );
      const Multicall = new ethers.Contract(
        MulticallContract.address,
        MulticallContract.abi,
        provider
      );

      const getAccountCollateralTxn = {
        target: CoreProxyContract.address,
        callData: CoreProxy.interface.encodeFunctionData('getAccountCollateral', [
          accountId,
          tokenAddress,
        ]),
        value: 0,
        requireSuccess: true,
      };

      console.time('getAccountCollateral');
      const response = await provider
        .call({
          to: MulticallContract.address,
          data: Multicall.interface.encodeFunctionData('aggregate3Value', [
            [
              getAccountCollateralTxn,
              ...(priceUpdateTxn.callData === ethers.constants.HashZero ? [] : [priceUpdateTxn]),
            ],
          ]),
          value: priceUpdateTxn.value,
        })
        .catch(errorParser);
      console.timeEnd('getAccountCollateral');

      const [[getAccountCollateralTxnData]] = Multicall.interface.decodeFunctionResult(
        'aggregate3Value',
        response || ''
      );

      const accountCollateral = CoreProxy.interface.decodeFunctionResult(
        'getAccountCollateral',
        getAccountCollateralTxnData.returnData
      );

      return {
        totalAssigned: accountCollateral.totalAssigned,
        totalDeposited: accountCollateral.totalDeposited,
        totalLocked: accountCollateral.totalLocked,
      };
    },
  });
}
