import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function commitOrder({
  wallet,
  PerpsMarketProxyContract,
  orderCommitmentArgs,
}: {
  wallet: WalletState;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  orderCommitmentArgs: {
    marketId: string;
    accountId: ethers.BigNumber;
    sizeDelta: ethers.BigNumber;
    settlementStrategyId: string;
    acceptablePrice: ethers.BigNumber;
    referrer: string;
    trackingCode: string;
  };
}) {
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);

  console.time('commitOrder');
  const tx: ethers.ContractTransaction = await PerpsMarketProxy.commitOrder(orderCommitmentArgs);
  console.timeEnd('commitOrder');
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
