import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchPositionCollateral({
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
  const positionCollateral = await CoreProxy.getPositionCollateral(accountId, poolId, tokenAddress);
  return positionCollateral;
}
