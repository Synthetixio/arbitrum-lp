import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchAccountPosition({
  wallet,
  PerpsMarketProxyContract,
  accountId,
  marketId,
}: {
  wallet: WalletState;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
  marketId: ethers.BigNumber;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  console.time('fetchAccountPosition');
  const position = await PerpsMarketProxy.getOpenPosition(accountId, marketId);
  console.timeEnd('fetchAccountPosition');
  return position;
}
