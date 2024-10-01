import { useParams } from '@snx-v3/useParams';
import { useAccounts } from '@synthetixio/react-sdk';
import { ethers } from 'ethers';
import React from 'react';

export function useSelectedAccountId({ provider, walletAddress }: { provider?: ethers.providers.BaseProvider; walletAddress?: string }) {
  const { data: accounts } = useAccounts({ provider, walletAddress });
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
