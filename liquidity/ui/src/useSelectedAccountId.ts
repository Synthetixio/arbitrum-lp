import { useParams } from '@snx-v3/useParams';
import React from 'react';
import { ethers } from 'ethers';
import { useAccounts } from './useAccounts';

export function useSelectedAccountId() {
  const { data: accounts } = useAccounts();
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
