import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchCollateralPriceWithPriceUpdate({
  wallet,
  CoreProxyContract,
  MulticallContract,
  tokenAddress,
  priceUpdateTxn,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string };
  MulticallContract: { address: string; abi: string };
  tokenAddress: string;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: number;
    requireSuccess: boolean;
  };
}) {
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  await new Promise((ok) => setTimeout(ok, 500));

  const getCollateralPriceTxn = {
    target: CoreProxyContract.address,
    callData: CoreProxyInterface.encodeFunctionData('getCollateralPrice', [tokenAddress]),
    value: 0,
    requireSuccess: true,
  };

  console.time('fetchCollateralPriceWithPriceUpdate');
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const response = await provider.call({
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [
      [priceUpdateTxn, getCollateralPriceTxn],
    ]),
    value: priceUpdateTxn.value,
  });
  console.timeEnd('fetchCollateralPriceWithPriceUpdate');
  console.log({ response });

  if (response) {
    const decodedMulticall = MulticallInterface.decodeFunctionResult('aggregate3Value', response);
    console.log({ decodedMulticall });
    if (decodedMulticall?.returnData?.[1]?.returnData) {
      const getCollateralPriceTxnData = decodedMulticall.returnData[1].returnData;
      console.log({ getCollateralPriceTxnData });
      const collateralPrice = CoreProxyInterface.decodeFunctionResult(
        'getCollateralPrice',
        getCollateralPriceTxnData
      );
      console.log(`>>>>> collateralPrice`, collateralPrice);
      return collateralPrice[0];
    } else {
      console.error({ decodedMulticall });
      throw new Error('Unexpected multicall response');
    }
  } else {
    throw new Error('Empty multicall response');
  }
}
