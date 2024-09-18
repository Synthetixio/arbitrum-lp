import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function perpsFetchTotalCollateralValue({
  wallet,
  PerpsMarketProxyContract,
  accountId,
}: {
  wallet: WalletState;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  console.time('perpsFetchTotalCollateralValue');
  const accountAvailableCollateral = await PerpsMarketProxy.totalCollateralValue(accountId);
  console.timeEnd('perpsFetchTotalCollateralValue');
  return accountAvailableCollateral;
}
