import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchTokenAllowance({
  wallet,
  tokenAddress,
  ownerAddress,
  spenderAddress,
}: {
  wallet: WalletState;
  tokenAddress: string;
  ownerAddress: string;
  spenderAddress: string;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const Token = new ethers.Contract(
    tokenAddress,
    ['function allowance(address owner, address spender) view returns (uint256)'],
    provider
  );
  return Token.allowance(ownerAddress, spenderAddress);
}
