import { useParams } from '@snx-v3/useParams';
import React from 'react';
import { useCollateralTokens } from './useCollateralTokens';

export function useSelectedCollateralType() {
  const [params] = useParams();
  const { data: collateralTokens } = useCollateralTokens();
  return React.useMemo(
    () => collateralTokens?.find((token) => params.collateralType === token.address),
    [collateralTokens, params.collateralType]
  );
}
