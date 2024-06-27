import { importCoreProxy } from '@snx-v3/contracts';
import { ethers } from 'ethers';

export async function depositCollateral({
  signer,
  accountId,
  tokenAddress,
  depositAmount,
}: {
  signer: ethers.Signer;
  accountId: string;
  tokenAddress: string;
  depositAmount: ethers.BigNumber;
}) {
  const chainId = await signer.getChainId();
  const CoreProxyContract = await importCoreProxy(chainId, 'main');
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);
  const tx: ethers.ContractTransaction = await CoreProxy['deposit'](
    //
    accountId,
    tokenAddress,
    depositAmount
  );
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
