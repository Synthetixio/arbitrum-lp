import { ethers } from 'ethers';

export async function fetchTokenBalance({
  provider,
  tokenAddress,
  ownerAddress,
}: {
  provider: ethers.providers.Web3Provider;
  tokenAddress: string;
  ownerAddress: string;
}) {
  const Token = new ethers.Contract(
    tokenAddress,
    ['function balanceOf(address account) view returns (uint256)'],
    provider
  );
  return Token.balanceOf(ownerAddress);
}
