import { useParams } from '@snx-v3/useParams';
import { ethers } from 'ethers';
import React from 'react';
import { usePerpsAccounts } from './usePerpsAccounts';

export function usePerpsSelectedAccountId() {
  const { data: accounts } = usePerpsAccounts();
  const [params] = useParams();

  return React.useMemo(() => {
    if (!params.perpsAccountId) {
      return;
    }
    if (!accounts) {
      return;
    }
    const perpsAccountId = ethers.BigNumber.from(params.perpsAccountId);
    return accounts.find((id) => perpsAccountId.eq(id));
  }, [accounts, params.perpsAccountId]);
}
