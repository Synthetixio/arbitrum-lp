import { useParams } from '@snx-v3/useParams';
import { usePerpsAccounts } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { useProvider } from './useProvider';

export function usePerpsSelectedAccountId() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = useProvider();
  const { data: accounts } = usePerpsAccounts({ provider, walletAddress });
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
