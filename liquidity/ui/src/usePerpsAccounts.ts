import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function usePerpsAccounts() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: PerpsAccountProxyContract } = useImportContract('PerpsAccountProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && PerpsAccountProxyContract?.address && walletAddress && wallet?.provider),
    queryKey: [chainId, { PerpsAccountProxy: PerpsAccountProxyContract?.address }, { ownerAddress: walletAddress }, 'PerpsAccounts'],
    queryFn: async () => {
      if (!(isChainReady && PerpsAccountProxyContract?.address && walletAddress && wallet?.provider)) throw 'OMFG';
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
