import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchAccountPositionMarketIds({
  wallet,
  PerpsMarketProxyContract,
  accountId,
}: {
  wallet: WalletState;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const PerpsProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  console.time('fetchAccountPositionMarkedIds');
  const accountPositionMarketIds = await PerpsProxy.getAccountOpenPositions(accountId);
  console.timeEnd('fetchAccountPositionMarkedIds');
  return accountPositionMarketIds;
}