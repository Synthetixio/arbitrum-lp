import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchAccountCollateral({
  wallet,
  CoreProxyContract,
  MulticallContract,
  accountId,
  tokenAddress,
  priceUpdateTxn,
  errorParser,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string };
  MulticallContract: { address: string; abi: string };
  accountId: string;
  tokenAddress: string;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: number;
    requireSuccess: boolean;
  };
  errorParser: (error: Error) => void;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  const Multicall = new ethers.Contract(MulticallContract.address, MulticallContract.abi, provider);
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
        [getAccountCollateralTxn, ...(priceUpdateTxn.value ? [priceUpdateTxn] : [])],
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
}
