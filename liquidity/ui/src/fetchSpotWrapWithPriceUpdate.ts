import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchSpotWrapWithPriceUpdate({
  wallet,
  SpotMarketProxyContract,
  MulticallContract,
  synthMarketId,
  amount,
  priceUpdateTxn,
}: {
  wallet: WalletState;
  SpotMarketProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  synthMarketId: string;
  amount: ethers.BigNumber;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: number;
    requireSuccess: boolean;
  };
}) {
  const SpotMarketProxyInterface = new ethers.utils.Interface(SpotMarketProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const wrapArgs = [synthMarketId, amount, amount];

  console.log({ wrapArgs });

  const wrapTxn = {
    target: SpotMarketProxyContract.address,
    callData: SpotMarketProxyInterface.encodeFunctionData('wrap', [...wrapArgs]),
    value: 0,
    requireSuccess: true,
  };
  console.log({ wrapTxn });

  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, wrapTxn]]),
    value: priceUpdateTxn.value,
  };
  console.log({ multicallTxn });

  console.time('fetchSpotWrapWithPriceUpdate');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('fetchSpotWrapWithPriceUpdate');

  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
