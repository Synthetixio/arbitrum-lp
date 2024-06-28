import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { useMulticall } from './useMulticall';
import { usePythERC7412Wrapper } from './usePythERC7412Wrapper';

export function usePriceUpdateTxn(priceIds?: string[]) {
  const [{ connectedChain }] = useSetChain();
  const { data: PythERC7412WrapperContract } = usePythERC7412Wrapper();
  const { data: MulticallContract } = useMulticall();
  const [{ wallet }] = useConnectWallet();
  return useQuery({
    enabled: Boolean(
      connectedChain?.id &&
        wallet?.provider &&
        PythERC7412WrapperContract &&
        MulticallContract &&
        priceIds
    ),
    queryKey: [connectedChain?.id, 'PriceUpdateTxn', { priceIds }],
    queryFn: async (): Promise<{
      target: string;
      callData: string;
      value: number;
      requireSuccess: boolean;
    }> => {
      if (
        !(
          connectedChain?.id &&
          wallet?.provider &&
          PythERC7412WrapperContract &&
          MulticallContract &&
          priceIds
        )
      ) {
        throw 'OMFG';
      }
      return await fetchPriceUpdateTxn({
        wallet,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
    },

    // considering real staleness tolerance at 3_600s,
    // refetching price updates every 10m should be way more than enough
    staleTime: 600_000,
    refetchInterval: 600_000,
  });
}
