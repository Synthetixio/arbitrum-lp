import type { WalletState } from '@web3-onboard/core';
import { ethers } from 'ethers';

export async function fetchMarketSummaryWithPriceUpdate({
  wallet,
  PerpsMarketProxyContract,
  MulticallContract,
  marketId,
  priceUpdateTxn,
}: {
  wallet: WalletState;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  marketId: ethers.BigNumber;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: number;
    requireSuccess: boolean;
  };
}) {
  const PerpsMarketProxyInterface = new ethers.utils.Interface(PerpsMarketProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const getMarketSummaryTxn = {
    target: PerpsMarketProxyContract.address,
    callData: PerpsMarketProxyInterface.encodeFunctionData('getMarketSummary', [marketId]),
    value: 0,
    requireSuccess: true,
  };

  const provider = new ethers.providers.Web3Provider(wallet.provider);
  const response = await provider.call({
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, getMarketSummaryTxn]]),
    value: priceUpdateTxn.value,
  });

  if (response) {
    const decodedMulticall = MulticallInterface.decodeFunctionResult('aggregate3Value', response);
    if (decodedMulticall?.returnData?.[1]?.returnData) {
      const getMarketSummaryTxnData = decodedMulticall.returnData[1].returnData;
      const marketSummary = PerpsMarketProxyInterface.decodeFunctionResult('getMarketSummary', getMarketSummaryTxnData);
      return marketSummary[0];
    }
    console.error({ decodedMulticall });
    throw new Error('Unexpected multicall response');
  }
  throw new Error('Empty multicall response');
}
