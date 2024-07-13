import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchMintUsd({
  wallet,
  CoreProxyContract,
  accountId,
  poolId,
  tokenAddress,
  mintUsdAmount,
}: {
  wallet: WalletState;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
  poolId: ethers.BigNumber;
  tokenAddress: string;
  mintUsdAmount: ethers.BigNumber;
}) {
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);

  const mintUsdTxnArgs = [
    //
    accountId,
    poolId,
    tokenAddress,
    mintUsdAmount,
  ];
  console.log('mintUsdTxnArgs', mintUsdTxnArgs);

  console.time('mintUsd');
  const tx: ethers.ContractTransaction = await CoreProxy.mintUsd(...mintUsdTxnArgs);
  console.timeEnd('mintUsd');

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
