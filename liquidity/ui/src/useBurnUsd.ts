import { useParams } from '@snx-v3/useParams';
import {
  fetchPriceUpdateTxn,
  useAllPriceFeeds,
  useErrorParser,
  useImportContract,
  useImportSystemToken,
  useSelectedCollateralType,
  useSynthetix,
} from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import type { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { fetchBurnUsd } from './fetchBurnUsd';
import { fetchBurnUsdWithPriceUpdate } from './fetchBurnUsdWithPriceUpdate';
import { useProvider } from './useProvider';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedPoolId } from './useSelectedPoolId';

export function useBurnUsd({ onSuccess }: { onSuccess: () => void }) {
  const { chainId } = useSynthetix();
  const provider = useProvider();
  const errorParser = useErrorParser();

  const [params] = useParams();

  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType({ collateralType: params.collateralType });
  const poolId = useSelectedPoolId();

  const { data: systemToken } = useImportSystemToken();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  const { data: priceIds } = useAllPriceFeeds();
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

  const queryClient = useQueryClient();
  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);
  return useMutation({
    retry: false,
    mutationFn: async (burnUsdAmount: ethers.BigNumber) => {
      if (
        !(
          isChainReady &&
          CoreProxyContract &&
          MulticallContract &&
          PythERC7412WrapperContract &&
          priceIds &&
          wallet &&
          provider &&
          accountId &&
          poolId &&
          collateralType &&
          systemToken
        )
      ) {
        throw 'OMFG';
      }

      if (burnUsdAmount.eq(0)) {
        throw new Error('Amount required');
      }

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
      console.log({ freshPriceUpdateTxn });

      const freshAccountAvailableUsd = await fetchAccountAvailableCollateral({
        wallet,
        CoreProxyContract,
        accountId,
        tokenAddress: systemToken.address,
      });
      console.log({ freshAccountAvailableUsd });

      const hasEnoughDeposit = freshAccountAvailableUsd.gte(burnUsdAmount);
      if (!hasEnoughDeposit) {
        throw new Error(`Not enough deposited ${systemToken.symbol}`);
      }

      if (freshPriceUpdateTxn.value) {
        console.log('-> burnUsdWithPriceUpdate');
        await fetchBurnUsdWithPriceUpdate({
          wallet,
          CoreProxyContract,
          MulticallContract,
          accountId,
          poolId,
          tokenAddress: collateralType.address,
          burnUsdAmount,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
      } else {
        console.log('-> burnUsd');
        await fetchBurnUsd({
          wallet,
          CoreProxyContract,
          accountId,
          poolId,
          tokenAddress: collateralType.address,
          burnUsdAmount,
        });
      }
      return { priceUpdated: true };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error).then();
      return false;
    },
    onSuccess: async ({ priceUpdated }) => {
      if (priceUpdated) {
        await queryClient.invalidateQueries({
          queryKey: [chainId, 'PriceUpdateTxn', { priceIds: priceIds?.map((p) => p.slice(0, 8)) }],
        });
      }

      // Intentionally do not await
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          'PositionDebt',
          { CoreProxy: CoreProxyContract?.address, Multicall: MulticallContract?.address },
          {
            accountId: accountId?.toHexString(),
            tokenAddress: collateralType?.address,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          'AccountAvailableCollateral',
          { CoreProxy: CoreProxyContract?.address },
          {
            accountId: accountId?.toHexString(),
            tokenAddress: systemToken?.address,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'AccountLastInteraction', { CoreProxy: CoreProxyContract?.address }, { accountId: accountId?.toHexString() }],
      });

      onSuccess();
    },
  });
}
