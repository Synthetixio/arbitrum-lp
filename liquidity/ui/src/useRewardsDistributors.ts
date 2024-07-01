import { importRewardsDistributors } from '@snx-v3/contracts';
import { useQuery } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export type RewardsDistributorType = {
  address: string;
  name: string;
  poolId: ethers.BigNumber;
  collateralType: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  payoutToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  rewardManager: string;
  isRegistered: boolean;
};

export function useRewardsDistributors() {
  const [{ connectedChain }] = useSetChain();
  return useQuery({
    enabled: Boolean(connectedChain?.id),
    queryKey: [connectedChain?.id, 'RewardsDistributors'],
    queryFn: async (): Promise<RewardsDistributorType[]> => {
      if (!connectedChain?.id) {
        throw 'OMFG';
      }
      const rewardsDistributors = await importRewardsDistributors(
        parseInt(connectedChain.id, 16),
        'main'
      );
      return rewardsDistributors;
    },
    select: (rewardsDistributors) =>
      rewardsDistributors.map((rd) => {
        Object.assign({
          poolId: ethers.BigNumber.from(rd.poolId),
        });
        return rd;
      }),
    staleTime: 60 * 60 * 1000,
  });
}
