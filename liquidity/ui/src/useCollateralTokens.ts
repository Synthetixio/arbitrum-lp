import { importCollateralTokens } from '@snx-v3/contracts';
import { useQuery } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export type CollateralToken = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  depositingEnabled: boolean;
  issuanceRatioD18: ethers.BigNumber;
  liquidationRatioD18: ethers.BigNumber;
  liquidationRewardD18: ethers.BigNumber;
  oracleNodeId: string;
  tokenAddress: string;
  minDelegationD18: ethers.BigNumber;
};

export function useCollateralTokens() {
  const [{ connectedChain }] = useSetChain();
  return useQuery({
    enabled: Boolean(connectedChain?.id),
    queryKey: [connectedChain?.id, 'Collaterals'],
    queryFn: async () => {
      if (!connectedChain?.id) throw 'OMFG';
      const tokens: CollateralToken[] = await importCollateralTokens(
        parseInt(connectedChain.id, 16),
        'main'
      );
      return tokens.filter(({ depositingEnabled }) => depositingEnabled);
    },
    select: (tokens) =>
      tokens.map((config) => {
        config.issuanceRatioD18 = ethers.BigNumber.from(config.issuanceRatioD18);
        config.liquidationRatioD18 = ethers.BigNumber.from(config.liquidationRatioD18);
        config.liquidationRewardD18 = ethers.BigNumber.from(config.liquidationRewardD18);
        config.minDelegationD18 = ethers.BigNumber.from(config.minDelegationD18);
        return config;
      }),
  });
}
