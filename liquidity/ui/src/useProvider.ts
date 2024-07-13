import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';

export function useProvider() {
  const [{ wallet }] = useConnectWallet();
  return React.useMemo(() => {
    if (wallet?.provider) {
      return new ethers.providers.Web3Provider(wallet.provider);
    }
  }, [wallet?.provider]);
}
