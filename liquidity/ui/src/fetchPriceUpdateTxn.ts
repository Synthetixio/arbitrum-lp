import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchPriceUpdateTxn({
  wallet,
  MulticallContract,
  PythERC7412WrapperContract,
  priceIds,
}: {
  wallet: WalletState;
  MulticallContract: { address: string; abi: string };
  PythERC7412WrapperContract: { address: string; abi: string };
  priceIds: string[];
}) {
  console.time('fetchPriceUpdateTxn');
  const stalenessTolerance = 1800; // half of 3600 required tolerance

  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);
  const PythERC7412WrapperInterface = new ethers.utils.Interface(PythERC7412WrapperContract.abi);
  const txs = priceIds.map((priceId) => ({
    target: PythERC7412WrapperContract.address,
    callData: PythERC7412WrapperInterface.encodeFunctionData('getLatestPrice', [
      priceId,
      stalenessTolerance,
    ]),
    value: 0,
    requireSuccess: false,
  }));

  const provider = new ethers.providers.Web3Provider(wallet.provider);

  const result = await provider.call({
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [txs]),
  });
  const [latestPrices] = MulticallInterface.decodeFunctionResult('aggregate3Value', result);
  const stalePriceIds = priceIds.filter((_priceId, i) => !latestPrices[i].success);
  if (stalePriceIds.length < 1) {
    return {
      target: PythERC7412WrapperContract.address,
      callData: ethers.constants.HashZero,
      value: 0,
      requireSuccess: false,
    };
  }
  console.log({ stalePriceIds });

  const priceService = new EvmPriceServiceConnection('https://hermes.pyth.network');
  const signedOffchainData = await priceService.getPriceFeedsUpdateData(stalePriceIds);
  const updateType = 1;
  const data = ethers.utils.defaultAbiCoder.encode(
    ['uint8', 'uint64', 'bytes32[]', 'bytes[]'],
    [updateType, stalenessTolerance, stalePriceIds, signedOffchainData]
  );
  console.timeEnd('fetchPriceUpdateTxn');
  const priceUpdateTxn = {
    target: PythERC7412WrapperContract.address,
    callData: PythERC7412WrapperInterface.encodeFunctionData('fulfillOracleQuery', [data]),
    value: stalePriceIds.length,
    requireSuccess: true,
  };
  console.log('fetchPriceUpdateTxn', { priceUpdateTxn });
  return priceUpdateTxn;
}
