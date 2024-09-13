import { ethers } from 'ethers';
import { getPythVaa } from './getPythVaa';

export async function fetchStrictPriceUpdateTxn({
  commitmentTime,
  commitmentPriceDelay,
  PythERC7412WrapperContract,
  feedId,
}: {
  commitmentTime: ethers.BigNumber;
  commitmentPriceDelay: ethers.BigNumber;
  PythERC7412WrapperContract: { address: string; abi: string[] };
  feedId: string;
}) {
  console.time('fetchStrictPriceUpdateTxn');
  const PythERC7412WrapperInterface = new ethers.utils.Interface(PythERC7412WrapperContract.abi);
  const timestamp = commitmentTime.add(commitmentPriceDelay);
  const offchainData = await getPythVaa({ pythPriceFeedId: feedId, timestamp: timestamp.toNumber() });
  const updateType = 2;
  const offchainDataEncoded = ethers.utils.defaultAbiCoder.encode(
    ['uint8', 'uint64', 'bytes32[]', 'bytes[]'],
    [updateType, timestamp, [feedId], [offchainData]]
  );
  console.timeEnd('fetchStrictPriceUpdateTxn');
  const priceUpdateTxn = {
    target: PythERC7412WrapperContract.address,
    callData: PythERC7412WrapperInterface.encodeFunctionData('fulfillOracleQuery', [offchainDataEncoded]),
    value: ethers.BigNumber.from(1),
    requireSuccess: true,
  };
  console.log({ priceUpdateTxn });
  return priceUpdateTxn;
}
