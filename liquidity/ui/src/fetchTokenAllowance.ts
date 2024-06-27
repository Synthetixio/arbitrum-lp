import { ethers } from 'ethers';

export async function fetchTokenAllowance({
  provider,
  tokenAddress,
  ownerAddress,
  spenderAddress,
}: {
  provider: ethers.providers.Web3Provider;
  tokenAddress: string;
  ownerAddress: string;
  spenderAddress: string;
}) {
  const Token = new ethers.Contract(
    tokenAddress,
    ['function allowance(address owner, address spender) view returns (uint256)'],
    provider
  );
  return Token.allowance(ownerAddress, spenderAddress);
}
