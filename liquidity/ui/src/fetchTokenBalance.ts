import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchTokenBalance({
  wallet,
  tokenAddress,
  ownerAddress,
}: {
  wallet: WalletState;
  tokenAddress: string;
  ownerAddress: string;
}) {
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const Token = new ethers.Contract(
    tokenAddress,
    ['function balanceOf(address account) view returns (uint256)'],
    provider
  );
  return Token.balanceOf(ownerAddress);
}
