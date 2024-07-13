import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchAccountAvailableCollateral({
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
  console.time('fetchAccountAvailableCollateral');
  const accountAvailableCollateral = await CoreProxy.getAccountAvailableCollateral(accountId, tokenAddress);
  console.timeEnd('fetchAccountAvailableCollateral');
  return accountAvailableCollateral;
}
