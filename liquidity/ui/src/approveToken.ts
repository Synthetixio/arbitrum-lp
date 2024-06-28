import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function approveToken({
  wallet,
  tokenAddress,
  spenderAddress,
  allowance,
}: {
  wallet: WalletState;
  tokenAddress: string;
  spenderAddress: string;
  allowance: ethers.BigNumber;
}) {
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);
  const Token = new ethers.Contract(
    tokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)'],
    signer
  );
  const tx: ethers.ContractTransaction = await Token['approve'](spenderAddress, allowance);
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
