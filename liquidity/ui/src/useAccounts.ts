import { importAccountProxy } from '@snx-v3/contracts';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function useAccounts() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  return useQuery({
    enabled: Boolean(connectedChain?.id && walletAddress && wallet?.provider),
    queryKey: [connectedChain?.id, walletAddress, 'Accounts'],
    queryFn: async () => {
      if (!(connectedChain?.id && walletAddress && wallet?.provider)) throw 'OMFG';
      const { address, abi } = await importAccountProxy(parseInt(connectedChain.id, 16), 'main');
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const AccountProxy = new ethers.Contract(address, abi, provider);
      const numberOfAccountTokens = await AccountProxy.balanceOf(walletAddress);
      if (numberOfAccountTokens.eq(0)) {
        // No accounts created yet
        return [];
      }
      const accountIndexes = Array.from(Array(numberOfAccountTokens.toNumber()).keys());
      const accounts = await Promise.all(
        accountIndexes.map((i) => AccountProxy.tokenOfOwnerByIndex(walletAddress, i))
      );
      return accounts.map((accountId) => accountId.toString());
    },
  });
}
