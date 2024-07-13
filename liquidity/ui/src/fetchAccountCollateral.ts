import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchAccountCollateral({
  wallet,
  CoreProxyContract,
  accountId,
  tokenAddress,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
  tokenAddress: string;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  console.time('fetchAccountCollateral');
  const accountCollateral = await CoreProxy.getAccountCollateral(accountId, tokenAddress);
  console.timeEnd('fetchAccountCollateral');
  return {
    totalAssigned: accountCollateral.totalAssigned,
    totalDeposited: accountCollateral.totalDeposited,
    totalLocked: accountCollateral.totalLocked,
  };
}
