import { useParams } from '@snx-v3/useParams';
import { useCollateralTokens } from '@synthetixio/react-sdk';
import React from 'react';

export function useSelectedCollateralType() {
  const [params] = useParams();
  const collateralTokens = useCollateralTokens();
  return React.useMemo(
    () => collateralTokens?.find((token) => params.collateralType === token.address),
    [collateralTokens, params.collateralType]
  );
}
