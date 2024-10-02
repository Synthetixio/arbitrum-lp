import { useParams } from '@snx-v3/useParams';
import { usePerpsAccounts } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { useProvider } from './useProvider';

export function usePerpsSelectedAccountId(): ethers.BigNumber | undefined {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = useProvider();
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
