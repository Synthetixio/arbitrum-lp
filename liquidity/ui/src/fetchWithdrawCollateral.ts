import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchWithdrawCollateral({
  wallet,
  CoreProxyContract,
  accountId,
  tokenAddress,
  withdrawAmount,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
  tokenAddress: string;
  withdrawAmount: ethers.BigNumber;
}) {
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);

  const withdrawCollateralTxnArgs = [
    //
    accountId,
    tokenAddress,
    withdrawAmount,
  ];
  console.log({ withdrawCollateralTxnArgs });

  console.time('withdrawCollateral');
  const tx: ethers.ContractTransaction = await CoreProxy.withdraw(...withdrawCollateralTxnArgs);
  console.timeEnd('withdrawCollateral');

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
