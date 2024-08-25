import { useParams } from '@snx-v3/useParams';
import { ethers } from 'ethers';
import React from 'react';
import { usePerpsAccounts } from './usePerpsAccounts';

export function useSelectedPerpsAccountId() {
  const { data: accounts } = usePerpsAccounts();
  const [params] = useParams();

  return React.useMemo(() => {
    if (!params.accountId) {
      return;
    }
    if (!accounts) {
      return;
    }
    const accountId = ethers.BigNumber.from(params.accountId);
    return accounts.find((id) => accountId.eq(id));
  }, [accounts, params.accountId]);
}
