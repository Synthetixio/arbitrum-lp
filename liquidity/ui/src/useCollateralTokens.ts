import { useImportCollateralTokens } from '@synthetixio/react-sdk';
import { ethers } from 'ethers';
import React from 'react';

export function useCollateralTokens() {
  const { data: tokens } = useImportCollateralTokens();
  return React.useMemo(() => {
    if (tokens) {
      return tokens
        .filter(({ depositingEnabled }) => depositingEnabled)
        .map(({ issuanceRatioD18, liquidationRatioD18, liquidationRewardD18, minDelegationD18, ...rest }) => ({
          ...rest,
          issuanceRatioD18: ethers.BigNumber.from(issuanceRatioD18),
          liquidationRatioD18: ethers.BigNumber.from(liquidationRatioD18),
          liquidationRewardD18: ethers.BigNumber.from(liquidationRewardD18),
          minDelegationD18: ethers.BigNumber.from(minDelegationD18),
        }));
    }
  }, [tokens]);
}
