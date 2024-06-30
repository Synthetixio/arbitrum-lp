import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchBurnUsd({
  wallet,
  CoreProxyContract,
  accountId,
  poolId,
  tokenAddress,
  burnUsdAmount,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string };
  accountId: ethers.BigNumber;
  poolId: ethers.BigNumber;
  tokenAddress: string;
  burnUsdAmount: ethers.BigNumber;
}) {
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);

  const burnUsdTxnArgs = [
    //
    accountId,
    poolId,
    tokenAddress,
    burnUsdAmount,
  ];
  console.log({ burnUsdTxnArgs });

  console.time('burnUsd');
  const tx: ethers.ContractTransaction = await CoreProxy.burnUsd(...burnUsdTxnArgs);
  console.timeEnd('burnUsd');

  console.log({ tx });
  if (window.$tx) {
    window.$tx.push(tx);
  } else {
    window.$tx = [tx];
  }
  const txResult = await tx.wait();
  console.log({ txResult });
  if (window.$txResult) {
    window.$txResult.push(txResult);
  } else {
    window.$txResult = [txResult];
  }

  return txResult;
}
