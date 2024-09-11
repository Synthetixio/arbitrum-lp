import { useParams } from '@snx-v3/useParams';
import { useErrorParser, useImportContract, useImportExtras, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { getPythPrice } from './getPythPrice';
import { perpsFetchAvailableMargin } from './perpsFetchAvailableMargin';
import { perpsFetchTotalCollateralValue } from './perpsFetchTotalCollateralValue';
import { usePerpsGetSettlementStrategy } from './usePerpsGetSettlementStrategy';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

export function usePerpsCommitOrder({ onSuccess }: { onSuccess: () => void }) {
  const [params] = useParams();
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);
  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const { data: extras } = useImportExtras();
  const { data: settlementStrategy } = usePerpsGetSettlementStrategy();
  const queryClient = useQueryClient();
  const errorParser = useErrorParser();

  return useMutation({
    mutationFn: async (sizeDelta: ethers.BigNumber) => {
      if (
        !(
          isChainReady &&
          PerpsMarketProxyContract?.address &&
          walletAddress &&
          wallet?.provider &&
          perpsAccountId &&
          extras &&
          settlementStrategy
        )
      ) {
        throw 'OMFG';
      }

      if (sizeDelta.lte(0)) {
        throw new Error('Amount required');
      }

      const availableMargin = await perpsFetchAvailableMargin({
        wallet,
        PerpsMarketProxyContract,
        accountId: perpsAccountId,
      });

      if (availableMargin.lt(sizeDelta)) {
        throw new Error('Not enough available margin');
      }

      const totalCollateralValue = await perpsFetchTotalCollateralValue({
        wallet,
        PerpsMarketProxyContract,
        accountId: perpsAccountId,
      });

      if (totalCollateralValue.lt(sizeDelta)) {
        throw new Error('Total collateral value is less than the size delta');
      }

      const pythPrice = await getPythPrice({ feedId: settlementStrategy.feedId });

      const orderCommitment = {
        marketId: params.market,
        accountId: perpsAccountId,
        sizeDelta,
        settlementStrategyId: extras.eth_pyth_settlement_strategy,
        acceptablePrice: ethers.utils.parseEther(Math.floor(pythPrice * (sizeDelta.gt(0) ? 1.05 : 0.95)).toString()),
        referrer: ethers.constants.AddressZero,
        trackingCode: ethers.utils.formatBytes32String('VD'),
      };

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);

      console.log('commitOrderArgs', orderCommitment);

      const tx = await PerpsMarketProxy.commitOrder(orderCommitment);
      const txResult = await tx.wait();

      const block = await provider.getBlock(txResult.blockNumber);
      const commitmentTime = block.timestamp;
      console.log({ commitmentTime: new Date(commitmentTime * 1000) });

      return { commitmentTime };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId, 'PerpsGetOrder'],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId, 'PerpsGetAvailableMargin'],
      });

      onSuccess();
    },
  });
}
