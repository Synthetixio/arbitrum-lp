import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function delegateCollateral({
  wallet,
  CoreProxyContract,
  accountId,
  poolId,
  tokenAddress,
  delegateAmount,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
  poolId: ethers.BigNumber;
  tokenAddress: string;
  delegateAmount: ethers.BigNumber;
}) {
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);

  const delegateCollateralTxnArgs = [
    //
    accountId,
    poolId,
    tokenAddress,
    delegateAmount,
    ethers.utils.parseEther('1'), // Leverage
  ];
  console.log('delegateCollateralTxnArgs', delegateCollateralTxnArgs);

  console.time('delegateCollateral');
  const tx: ethers.ContractTransaction = await CoreProxy.delegateCollateral(...delegateCollateralTxnArgs);
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
