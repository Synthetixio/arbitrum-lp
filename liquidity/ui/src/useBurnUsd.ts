import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { fetchBurnUsd } from './fetchBurnUsd';
import { fetchBurnUsdWithPriceUpdate } from './fetchBurnUsdWithPriceUpdate';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { useErrorParser } from './parseError';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useCoreProxy } from './useCoreProxy';
import { useMulticall } from './useMulticall';
import { usePythERC7412Wrapper } from './usePythERC7412Wrapper';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';
import { useSystemToken } from './useSystemToken';

export function useBurnUsd() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: systemToken } = useSystemToken();

  const { data: CoreProxyContract } = useCoreProxy();

  const errorParser = useErrorParser();
  const { data: priceIds } = useAllPriceFeeds();
  const { data: MulticallContract } = useMulticall();
  const { data: PythERC7412WrapperContract } = usePythERC7412Wrapper();

  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (burnUsdAmount: ethers.BigNumber) => {
      if (
        !(
          CoreProxyContract &&
          MulticallContract &&
          PythERC7412WrapperContract &&
          priceIds &&
          connectedChain?.id &&
          walletAddress &&
          wallet?.provider &&
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
        wallet,
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
          queryKey: [
            connectedChain?.id,
            'PriceUpdateTxn',
            { priceIds: priceIds?.map((p) => p.slice(0, 8)) },
          ],
        });
      }

      // Intentionally do not await
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'PositionDebt',
          { accountId: accountId?.toHexString(), tokenAddress: collateralType?.address },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'AccountAvailableCollateral',
          {
            accountId: accountId?.toHexString(),
            tokenAddress: systemToken?.address,
          },
        ],
      });
    },
  });
}
