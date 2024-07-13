import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchPositionDebt({
  wallet,
  CoreProxyContract,
  accountId,
  poolId,
  tokenAddress,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
  poolId: ethers.BigNumber;
  tokenAddress: string;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  console.time('fetchPositionDebt');
  const positionDebt = await CoreProxy.callStatic.getPositionDebt(accountId, poolId, tokenAddress);
  console.timeEnd('fetchPositionDebt');
  return positionDebt;
}
