import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function settleOrderWithPriceUpdate({
  wallet,
  PerpsMarketProxyContract,
  MulticallContract,
  perpsAccountId,
  priceUpdateTxn,
}: {
  wallet: WalletState;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  perpsAccountId: ethers.BigNumber;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumber;
    requireSuccess: boolean;
  };
}) {
  const PerpsMarketPoxyInterface = new ethers.utils.Interface(PerpsMarketProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const settleOrderTxn = {
    target: PerpsMarketProxyContract.address,
    callData: PerpsMarketPoxyInterface.encodeFunctionData('settleOrder', [perpsAccountId]),
    value: 0,
    requireSuccess: true,
  };
  console.log({ settleOrderTxn });

  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, settleOrderTxn]]),
    value: priceUpdateTxn.value,
  };
  console.log({ multicallTxn });

  console.time('settleOrder');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('settleOrder');

  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
