import { useParams } from '@snx-v3/useParams';
import { ethers } from 'ethers';
import React from 'react';

const pools = [ethers.BigNumber.from('1')];

export function useSelectedPoolId() {
  const [params] = useParams();

  return React.useMemo(() => {
    if (!params.poolId) {
      return ethers.BigNumber.from('1');
    }
    const poolId = ethers.BigNumber.from(params.poolId);
    return pools.find((id) => poolId.eq(id));
  }, [params.poolId]);
}
