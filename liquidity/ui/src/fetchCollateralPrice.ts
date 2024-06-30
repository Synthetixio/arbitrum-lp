import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchCollateralPrice({
  wallet,
  CoreProxyContract,
  tokenAddress,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string };
  tokenAddress: string;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  console.time('fetchCollateralPrice');
  const collateralPrice = await CoreProxy.getCollateralPrice(tokenAddress);
  console.timeEnd('fetchCollateralPrice');
  return collateralPrice;
}
