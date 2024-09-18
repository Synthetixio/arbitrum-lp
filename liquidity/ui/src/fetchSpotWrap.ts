import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchSpotWrap({
  wallet,
  SpotMarketProxyContract,
  synthMarketId,
  amount,
}: {
  wallet: WalletState;
  SpotMarketProxyContract: { address: string; abi: string[] };
  synthMarketId: string;
  amount: ethers.BigNumber;
}) {
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);
  const SpotMarketProxy = new ethers.Contract(SpotMarketProxyContract.address, SpotMarketProxyContract.abi, signer);

  console.time('fetchSpotWrap');
  const tx: ethers.ContractTransaction = await SpotMarketProxy.wrap(synthMarketId, amount, amount);
  console.timeEnd('fetchSpotWrap');
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
