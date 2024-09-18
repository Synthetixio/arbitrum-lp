import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function spotSell({
  wallet,
  SpotMarketProxyContract,
  marketId,
  amount,
}: {
  wallet: WalletState;
  SpotMarketProxyContract: { address: string; abi: string[] };
  marketId: string;
  amount: ethers.BigNumber;
}) {
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);
  const SpotMarketProxy = new ethers.Contract(SpotMarketProxyContract.address, SpotMarketProxyContract.abi, signer);

  console.time('spotSell');
  const tx: ethers.ContractTransaction = await SpotMarketProxy.sell(marketId, amount, amount, ethers.constants.AddressZero);
  console.timeEnd('spotSell');
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
