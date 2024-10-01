import { useParams } from '@snx-v3/useParams';
import { usePerpsAccounts } from '@synthetixio/react-sdk';
import { ethers } from 'ethers';
import React from 'react';

export function usePerpsSelectedAccountId({
  provider,
  walletAddress,
}: { provider?: ethers.providers.BaseProvider; walletAddress?: string }): ethers.BigNumber | undefined {
  const { data: perpsAccounts } = usePerpsAccounts({ provider, walletAddress });
  const [params] = useParams();

  return React.useMemo(() => {
    if (!params.perpsAccountId) {
      return;
    }
    if (!perpsAccounts) {
      return;
    }
    const bigNumberPerpsAccountId = ethers.BigNumber.from(params.perpsAccountId);
    return perpsAccounts.find((id) => bigNumberPerpsAccountId.eq(id));
  }, [perpsAccounts, params.perpsAccountId]);
}
