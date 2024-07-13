import { useImportContract } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function useAccounts() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: AccountProxyContract } = useImportContract('AccountProxy');

  return useQuery({
    enabled: Boolean(connectedChain?.id && walletAddress && wallet?.provider && AccountProxyContract),
    queryKey: [connectedChain?.id, 'Accounts', { ownerAddress: walletAddress }],
    queryFn: async () => {
      if (!(connectedChain?.id && walletAddress && wallet?.provider && AccountProxyContract)) throw 'OMFG';
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const AccountProxy = new ethers.Contract(AccountProxyContract.address, AccountProxyContract.abi, provider);
      const numberOfAccountTokens = await AccountProxy.balanceOf(walletAddress);
      if (numberOfAccountTokens.eq(0)) {
        // No accounts created yet
        return [];
      }
      const accountIndexes = Array.from(Array(numberOfAccountTokens.toNumber()).keys());
      const accounts = await Promise.all(accountIndexes.map((i) => AccountProxy.tokenOfOwnerByIndex(walletAddress, i)));
      return accounts;
    },
    select: (accounts) => accounts.map((accountId) => ethers.BigNumber.from(accountId)),
  });
}
