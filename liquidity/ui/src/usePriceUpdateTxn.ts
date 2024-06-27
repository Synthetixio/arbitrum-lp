import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
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
    queryFn: async () => {
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
      const stalenessTolerance = 3600;

      const multicallInterface = new ethers.utils.Interface(MulticallContract.abi);
      const erc7412Interface = new ethers.utils.Interface(PythERC7412WrapperContract.abi);
      const txs = priceIds.map((priceId) => ({
        target: PythERC7412WrapperContract.address,
        callData: erc7412Interface.encodeFunctionData('getLatestPrice', [
          priceId,
          stalenessTolerance,
        ]),
        value: 0,
        requireSuccess: false,
      }));

      const provider = new ethers.providers.Web3Provider(wallet.provider);

      const result = await provider.call({
        to: MulticallContract.address,
        data: multicallInterface.encodeFunctionData('aggregate3Value', [txs]),
      });
      const [latestPrices] = multicallInterface.decodeFunctionResult('aggregate3Value', result);
      const stalePriceIds = priceIds.filter((_priceId, i) => !latestPrices[i].success);
      if (stalePriceIds.length < 1) {
        return {
          target: PythERC7412WrapperContract.address,
          callData: ethers.constants.HashZero,
          value: ethers.constants.Zero,
          requireSuccess: false,
        };
      }

      const priceService = new EvmPriceServiceConnection('https://hermes.pyth.network');
      const signedOffchainData = await priceService.getPriceFeedsUpdateData(stalePriceIds);
      const updateType = 1;
      const data = ethers.utils.defaultAbiCoder.encode(
        ['uint8', 'uint64', 'bytes32[]', 'bytes[]'],
        [updateType, stalenessTolerance, stalePriceIds, signedOffchainData]
      );
      return {
        target: PythERC7412WrapperContract.address,
        callData: erc7412Interface.encodeFunctionData('fulfillOracleQuery', [data]),
        value: stalePriceIds.length,
        requireSuccess: true,
      };
    },

    // considering real staleness tolerance at 3_600s,
    // refetching price updates every 10m should be way more than enough
    staleTime: 600_000,
    refetchInterval: 600_000,
  });
}
