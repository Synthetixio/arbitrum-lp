import { ethers } from 'ethers';

export async function approveToken({
  signer,
  tokenAddress,
  spenderAddress,
  allowance,
}: {
  signer: ethers.Signer;
  tokenAddress: string;
  spenderAddress: string;
  allowance: ethers.BigNumber;
}) {
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
