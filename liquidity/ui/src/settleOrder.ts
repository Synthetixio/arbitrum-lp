import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function settleOrder({
  wallet,
  PerpsMarketProxyContract,
  perpsAccountId,
}: {
  wallet: WalletState;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  perpsAccountId: ethers.BigNumber;
}) {
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);

  console.time('settleOrder');
  const tx: ethers.ContractTransaction = await PerpsMarketProxy.settleOrder(perpsAccountId);
  console.timeEnd('settleOrder');
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
