import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchBurnUsdWithPriceUpdate({
  wallet,
  CoreProxyContract,
  MulticallContract,
  accountId,
  poolId,
  tokenAddress,
  burnUsdAmount,
  priceUpdateTxn,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string };
  MulticallContract: { address: string; abi: string };
  accountId: ethers.BigNumber;
  poolId: ethers.BigNumber;
  tokenAddress: string;
  burnUsdAmount: ethers.BigNumber;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: number;
    requireSuccess: boolean;
  };
}) {
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const burnUsdTxnArgs = [
    //
    accountId,
    poolId,
    tokenAddress,
    burnUsdAmount,
  ];
  console.log(`burnUsdTxnArgs`, burnUsdTxnArgs);

  const burnUsdTxn = {
    target: CoreProxyContract.address,
    callData: CoreProxyInterface.encodeFunctionData('burnUsd', [
      //
      ...burnUsdTxnArgs,
    ]),
    value: 0,
    requireSuccess: true,
  };
  console.log(`burnUsdTxn`, burnUsdTxn);

  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, burnUsdTxn]]),
    value: priceUpdateTxn.value,
  };
  console.log({ multicallTxn });

  console.time('burnUsd');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('burnUsd');

  console.log({ tx });
  if (window.$tx) {
    window.$tx.push(tx);
  } else {
    window.$tx = [tx];
  }
  const txResult = await tx.wait();
  console.log({ txResult });
  if (window.$txResult) {
    window.$txResult.push(txResult);
  } else {
    window.$txResult = [txResult];
  }

  return txResult;
}
