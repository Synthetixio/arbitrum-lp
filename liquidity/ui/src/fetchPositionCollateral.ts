import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchPositionCollateral({
  wallet,
  CoreProxyContract,
  accountId,
  poolId,
  tokenAddress,
  errorParser,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string };
  accountId: string;
  poolId: string;
  tokenAddress: string;
  errorParser: (error: Error) => void;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  const positionCollateral = await CoreProxy.getPositionCollateral(
    accountId,
    poolId,
    tokenAddress
  ).catch(errorParser);
  return positionCollateral;
}
