import { useImportContract } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function usePerpsAccounts() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: PerpsAccountProxyContract } = useImportContract('PerpsAccountProxy');

  return useQuery({
    enabled: Boolean(connectedChain?.id && walletAddress && wallet?.provider && PerpsAccountProxyContract),
    queryKey: [connectedChain?.id, 'PerpsAccounts', { ownerAddress: walletAddress }],
    queryFn: async () => {
      if (!(connectedChain?.id && walletAddress && wallet?.provider && PerpsAccountProxyContract)) throw 'OMFG';
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const PerpsAccountProxy = new ethers.Contract(PerpsAccountProxyContract.address, PerpsAccountProxyContract.abi, provider);
      const numberOfAccountTokens = await PerpsAccountProxy.balanceOf(walletAddress);
      if (numberOfAccountTokens.eq(0)) {
        // No accounts created yet
        return [];
      }
      const accountIndexes = Array.from(Array(numberOfAccountTokens.toNumber()).keys());
      const accounts = await Promise.all(accountIndexes.map((i) => PerpsAccountProxy.tokenOfOwnerByIndex(walletAddress, i)));
      return accounts;
    },
    select: (accounts) => accounts.map((accountId) => ethers.BigNumber.from(accountId)),
  });
}
