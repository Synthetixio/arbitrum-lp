import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchPositionDebtWithPriceUpdate({
  wallet,
  CoreProxyContract,
  MulticallContract,
  accountId,
  poolId,
  tokenAddress,
  priceUpdateTxn,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string };
  MulticallContract: { address: string; abi: string };
  accountId: ethers.BigNumber;
  poolId: ethers.BigNumber;
  tokenAddress: string;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: number;
    requireSuccess: boolean;
  };
}) {
  // const CoreProxyInterface = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  await new Promise((ok) => setTimeout(ok, 500));

  const getPositionDebtTxn = {
    target: CoreProxyContract.address,
    callData: CoreProxyInterface.encodeFunctionData('getPositionDebt', [
      accountId,
      poolId,
      tokenAddress,
    ]),
    value: 0,
    requireSuccess: true,
  };
  // const Multicall = new ethers.Contract(MulticallContract.address, MulticallContract.abi, provider);

  console.time('fetchPositionDebtWithPriceUpdate');
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const response = await provider.call({
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [
      [priceUpdateTxn, getPositionDebtTxn],
    ]),
    value: priceUpdateTxn.value,
  });
  console.timeEnd('fetchPositionDebtWithPriceUpdate');
  console.log({ response });

  if (response) {
    const decodedMulticall = MulticallInterface.decodeFunctionResult('aggregate3Value', response);
    console.log({ decodedMulticall });
    if (decodedMulticall?.returnData?.[1]?.returnData) {
      const getPositionDebtTxnData = decodedMulticall.returnData[1].returnData;
      console.log({ getPositionDebtTxnData });
      const positionDebt = CoreProxyInterface.decodeFunctionResult(
        'getPositionDebt',
        getPositionDebtTxnData
      );
      return positionDebt.debt;
    } else {
      console.error({ decodedMulticall });
      throw new Error('Unexpected multicall response');
    }
  } else {
    throw new Error('Empty multicall response');
  }
}
