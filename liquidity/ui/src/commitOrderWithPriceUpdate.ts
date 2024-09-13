import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function commitOrderWithPriceUpdate({
  wallet,
  PerpsMarketProxyContract,
  MulticallContract,
  orderCommitmentArgs,
  priceUpdateTxn,
}: {
  wallet: WalletState;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  orderCommitmentArgs: {
    marketId: string;
    accountId: ethers.BigNumber;
    sizeDelta: ethers.BigNumber;
    settlementStrategyId: string;
    acceptablePrice: ethers.BigNumber;
    referrer: string;
    trackingCode: string;
  };
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: number;
    requireSuccess: boolean;
  };
}) {
  const PerpsMarketPoxyInterface = new ethers.utils.Interface(PerpsMarketProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const commitOrderTxn = {
    target: PerpsMarketProxyContract.address,
    callData: PerpsMarketPoxyInterface.encodeFunctionData('commitOrder', [orderCommitmentArgs]),
    value: 0,
    requireSuccess: true,
  };
  console.log({ commitOrderTxn });

  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, commitOrderTxn]]),
    value: priceUpdateTxn.value,
  };
  console.log({ multicallTxn });

  console.time('commitOrder');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('commitOrder');

  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
