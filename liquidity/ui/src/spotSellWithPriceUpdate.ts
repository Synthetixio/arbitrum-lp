import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function spotSellWithPriceUpdate({
  wallet,
  SpotMarketProxyContract,
  MulticallContract,
  marketId,
  amount,
  priceUpdateTxn,
}: {
  wallet: WalletState;
  SpotMarketProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  marketId: string;
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

  const sellArgs = [marketId, amount, amount, ethers.constants.AddressZero];

  console.log({ sellArgs });

  const sellTnx = {
    target: SpotMarketProxyContract.address,
    callData: SpotMarketProxyInterface.encodeFunctionData('sell', [...sellArgs]),
    value: 0,
    requireSuccess: true,
  };
  console.log({ sellTnx });

  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, sellTnx]]),
    value: priceUpdateTxn.value,
  };
  console.log({ multicallTxn });

  console.time('spotSellWithPriceUpdate');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('spotSellWithPriceUpdate');

  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
