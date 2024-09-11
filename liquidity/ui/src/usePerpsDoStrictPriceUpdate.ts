import { useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { getPythVaa } from './getPythVaa';
import { usePerpsGetSettlementStrategy } from './usePerpsGetSettlementStrategy';

const ERC7412_ABI = [
  'error OracleDataRequired(address oracleContract, bytes oracleQuery)',
  'error FeeRequired(uint feeAmount)',
  'function oracleId() view external returns (bytes32)',
  'function fulfillOracleQuery(bytes calldata signedOffchainData) payable external',
];

export function usePerpsDoStrictPriceUpdate({ commitmentTime }: { commitmentTime?: number }) {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: settlementStrategy } = usePerpsGetSettlementStrategy();

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: false,
    queryKey: [chainId, walletAddress, { settlementStrategy }, commitmentTime, 'PerpsDoStrictPriceUpdate'],
    queryFn: async () => {
      if (!(isChainReady && wallet?.provider && settlementStrategy && commitmentTime && walletAddress)) {
        throw 'OMFG';
      }

      const timestamp = commitmentTime + settlementStrategy.commitmentPriceDelay.toNumber();

      const offchainData = await getPythVaa({ pythPriceFeedId: settlementStrategy.feedId, timestamp });

      const UPDATE_TYPE = 2;
      const offchainDataEncoded = ethers.utils.defaultAbiCoder.encode(
        ['uint8', 'uint64', 'bytes32[]', 'bytes[]'],
        [UPDATE_TYPE, timestamp, [settlementStrategy.feedId], [offchainData]]
      );

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const PriceVerificationContract = new ethers.Contract(settlementStrategy.priceVerificationContract, ERC7412_ABI, signer);

      const tx = await PriceVerificationContract.fulfillOracleQuery(offchainDataEncoded, {
        value: ethers.BigNumber.from(1), // 1 wei
      });

      console.log('Price Update Transaction Details:', tx);

      return tx;
    },
    throwOnError: (error) => {
      console.error(error);
      return false;
    },
    // refetchInterval: 60 * 1000, // 60,000 milliseconds, equal to 60 seconds.
  });
}
