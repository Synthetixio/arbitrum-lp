import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function delegateCollateral({
  wallet,
  CoreProxyContract,
  MulticallContract,
  accountId,
  poolId,
  tokenAddress,
  delegateAmount,
  priceUpdateTxn,
  errorParser,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string };
  MulticallContract: { address: string; abi: string };
  accountId: string;
  poolId: string;
  tokenAddress: string;
  delegateAmount: ethers.BigNumber;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: number;
    requireSuccess: boolean;
  };
  errorParser: (error: Error) => void;
}) {
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const delegateCollateralTxnArgs = [
    //
    ethers.BigNumber.from(accountId),
    ethers.BigNumber.from(poolId),
    tokenAddress,
    delegateAmount,
    ethers.utils.parseEther('1'), // Leverage
  ];
  console.log(`delegateCollateralTxnArgs`, delegateCollateralTxnArgs);

  const delegateCollateralTxn = {
    target: CoreProxyContract.address,
    callData: CoreProxyInterface.encodeFunctionData('delegateCollateral', [
      //
      ...delegateCollateralTxnArgs,
    ]),
    value: 0,
    requireSuccess: true,
  };
  console.log(`delegateCollateralTxn`, delegateCollateralTxn);

  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [
      [...(priceUpdateTxn.value ? [priceUpdateTxn] : []), delegateCollateralTxn],
    ]),
    value: priceUpdateTxn.value,
  };
  console.log(`multicallTxn`, multicallTxn);

  console.time('delegateCollateral');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('delegateCollateral');

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
