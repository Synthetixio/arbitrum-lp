import { useParams } from '@snx-v3/useParams';
import { useAccounts } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { useProvider } from './useProvider';

export function useSelectedAccountId(): ethers.BigNumber | undefined {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = useProvider();
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
