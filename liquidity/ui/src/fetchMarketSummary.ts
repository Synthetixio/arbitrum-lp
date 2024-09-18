import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchMarketSummary({
  wallet,
  PerpsMarketProxyContract,
  marketId,
}: {
  wallet: WalletState;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  marketId: ethers.BigNumber;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  const marketSummary = await PerpsMarketProxy.getMarketSummary(marketId);
  return marketSummary;
}
