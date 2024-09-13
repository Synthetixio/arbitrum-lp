import { useParams } from '@snx-v3/useParams';
import { fetchPriceUpdateTxn, useErrorParser, useImportContract, useImportExtras, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { commitOrder } from './commitOrder';
import { commitOrderWithPriceUpdate } from './commitOrderWithPriceUpdate';
import { getPythPrice } from './getPythPrice';
import { perpsFetchAvailableMargin } from './perpsFetchAvailableMargin';
import { perpsFetchTotalCollateralValue } from './perpsFetchTotalCollateralValue';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { usePerpsGetSettlementStrategy } from './usePerpsGetSettlementStrategy';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';
import { useProvider } from './useProvider';

export function usePerpsCommitOrder({ onSuccess }: { onSuccess: () => void }) {
  const [params] = useParams();
  const { chainId } = useSynthetix();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: settlementStrategy } = usePerpsGetSettlementStrategy();
  const { data: priceIds } = useAllPriceFeeds();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');
  const { data: extras } = useImportExtras();

  const [{ connectedChain }] = useSetChain();
  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  const queryClient = useQueryClient();
  const errorParser = useErrorParser();
  const provider = useProvider();

  return useMutation({
    retry: false,
    mutationFn: async (sizeDelta: ethers.BigNumber) => {
      if (
        !(
          isChainReady &&
          perpsAccountId &&
          settlementStrategy &&
          priceIds &&
          PerpsMarketProxyContract?.address &&
          MulticallContract?.address &&
          PythERC7412WrapperContract?.address &&
          extras &&
          walletAddress &&
          wallet?.provider &&
          provider
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

      const orderCommitmentArgs = {
        marketId: params.market,
        accountId: perpsAccountId,
        sizeDelta,
        settlementStrategyId: extras.eth_pyth_settlement_strategy,
        acceptablePrice: ethers.utils.parseEther(Math.floor(pythPrice * (sizeDelta.gt(0) ? 1.05 : 0.95)).toString()),
        referrer: ethers.constants.AddressZero,
        trackingCode: ethers.utils.formatBytes32String('VD'),
      };

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
      console.log('freshPriceUpdateTxn', freshPriceUpdateTxn);

      if (freshPriceUpdateTxn.value) {
        console.log('-> commitOrderWithPriceUpdate');
        await commitOrderWithPriceUpdate({
          wallet,
          PerpsMarketProxyContract,
          MulticallContract,
          orderCommitmentArgs,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
      } else {
        console.log('-> commitOrder');
        await commitOrder({
          wallet,
          PerpsMarketProxyContract,
          orderCommitmentArgs,
        });
      }

      return { priceUpdated: true };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: async ({ priceUpdated }) => {
      if (priceUpdated) {
        await queryClient.invalidateQueries({
          queryKey: [chainId, 'PriceUpdateTxn', { priceIds: priceIds?.map((p) => p.slice(0, 8)) }],
        });
      }
      queryClient.invalidateQueries({
        queryKey: [chainId, 'PerpsGetOrder', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'PerpsGetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });

      onSuccess();
    },
  });
}
