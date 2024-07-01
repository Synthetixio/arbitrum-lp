import { Button, Heading, InputGroup, Stack } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { useErrorParser } from './parseError';
import { renderAmount } from './renderAmount';
import { useCoreProxy } from './useCoreProxy';
import { useDeposit } from './useDeposit';
import type { RewardsDistributorType } from './useRewardsDistributors';
import { useRewardsDistributors } from './useRewardsDistributors';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

function ClaimRewards({
  collateralType,
  rewardsDistributor,
}: {
  collateralType: { address: string; symbol: string; decimals: number };
  rewardsDistributor: RewardsDistributorType;
}) {
  const claim = useDeposit({
    onSuccess: () => {},
  });

  const accountId = useSelectedAccountId();
  const poolId = useSelectedPoolId();

  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: CoreProxyContract } = useCoreProxy();

  const { data: rewardsAmount } = useQuery({
    enabled: Boolean(
      connectedChain?.id &&
        wallet?.provider &&
        walletAddress &&
        CoreProxyContract &&
        accountId &&
        collateralType &&
        rewardsDistributor
    ),
    queryKey: [
      connectedChain?.id,
      'AvailableRewards',
      {
        accountId: accountId?.toHexString(),
        rewardsDistributor: rewardsDistributor?.address,
        collateralType: collateralType?.address,
      },
    ],
    queryFn: async () => {
      if (
        !(
          connectedChain?.id &&
          wallet?.provider &&
          walletAddress &&
          CoreProxyContract &&
          accountId &&
          poolId &&
          collateralType &&
          rewardsDistributor
        )
      ) {
        throw 'OMFG';
      }
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const CoreProxy = new ethers.Contract(
        CoreProxyContract.address,
        CoreProxyContract.abi,
        signer
      );
      console.time('useAvailableRewards');
      const availableRewards = await CoreProxy.callStatic.claimRewards(
        accountId,
        poolId,
        collateralType.address,
        rewardsDistributor.address
      );
      console.timeEnd('useAvailableRewards');
      return availableRewards;
    },
    select: (availableRewards) => ethers.BigNumber.from(availableRewards),
    refetchInterval: 5 * 60 * 1000,
  });

  const queryClient = useQueryClient();
  const claimRewards = useMutation({
    retry: false,
    mutationFn: async () => {
      if (
        !(
          CoreProxyContract &&
          connectedChain?.id &&
          walletAddress &&
          wallet?.provider &&
          accountId &&
          poolId
        )
      ) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const CoreProxy = new ethers.Contract(
        CoreProxyContract.address,
        CoreProxyContract.abi,
        signer
      );

      const claimRewardsTxnArgs = [
        //
        accountId,
        poolId,
        collateralType.address,
        rewardsDistributor.address,
      ];
      console.log({ claimRewardsTxnArgs });

      console.time('claimRewards');
      const tx: ethers.ContractTransaction = await CoreProxy.claimRewards(...claimRewardsTxnArgs);
      console.timeEnd('claimRewards');

      console.log({ tx });
      if (window.$tx) {
        window.$tx.push(tx);
      } else {
        window.$tx = [tx];
      }
      const txResult = await tx.wait();
      console.log({ txResult });
      if (window.$txResult) {
        window.$txResult.push(txResult);
      } else {
        window.$txResult = [txResult];
      }
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: async () => {
      // Intentionally do not await
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'AvailableRewards',
          {
            accountId: accountId?.toHexString(),
            rewardsDistributor: rewardsDistributor?.address,
            collateralType: collateralType?.address,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          connectedChain?.id,
          'Balance',
          {
            tokenAddress: collateralType?.address,
            ownerAddress: walletAddress,
          },
        ],
      });
    },
  });

  return (
    <Button
      type="button"
      isLoading={claim.isPending}
      isDisabled={!(rewardsAmount && rewardsAmount.gt(0))}
      onClick={() => claimRewards.mutate()}
    >
      {rewardsAmount && rewardsAmount.gt(0)
        ? `Claim ${renderAmount(rewardsAmount, collateralType)}`
        : `No ${collateralType.symbol} rewards available`}
    </Button>
  );
}

export function Rewards() {
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: rewardsDistributors } = useRewardsDistributors();
  return (
    <Stack gap={3}>
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Rewards
      </Heading>
      <InputGroup gap={3}>
        {collateralType && rewardsDistributors && poolId ? (
          rewardsDistributors
            .filter(
              (rd) =>
                rd.collateralType.address.toLowerCase() === collateralType.address.toLowerCase() &&
                poolId.eq(rd.poolId)
            )
            .map((rd) => (
              <ClaimRewards
                key={rd.address}
                collateralType={collateralType}
                rewardsDistributor={rd}
              />
            ))
        ) : (
          <Button type="button" isDisabled>
            No {collateralType ? collateralType.symbol : null} rewards available
          </Button>
        )}
      </InputGroup>
    </Stack>
  );
}
