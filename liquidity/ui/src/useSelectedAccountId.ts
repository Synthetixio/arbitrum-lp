import { useParams } from '@snx-v3/useParams';
import React from 'react';
import { useAccounts } from './useAccounts';

export function useSelectedAccountId() {
  const { data: accounts } = useAccounts();
  const [params] = useParams();

  return React.useMemo(
    () => (accounts && accounts.includes(params.accountId) ? params.accountId : undefined),
    [accounts, params.accountId]
  );
}
