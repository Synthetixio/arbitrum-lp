import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function useAccounts() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: AccountProxyContract } = useImportContract('AccountProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && AccountProxyContract?.address && walletAddress && wallet?.provider),
    queryKey: [chainId, 'Accounts', { AccountProxy: AccountProxyContract?.address }, { ownerAddress: walletAddress }],
    queryFn: async () => {
      if (!(isChainReady && AccountProxyContract?.address && walletAddress && wallet?.provider)) throw 'OMFG';
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
