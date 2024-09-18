import { useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function useEthBalance() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && wallet?.provider),
    queryKey: [chainId, 'EthBalance', { ownerAddress: walletAddress }],
    queryFn: async () => {
      if (!(isChainReady && wallet?.provider)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      return balance;
    },
    throwOnError: (error) => {
      console.error(error);
      return false;
    },
    refetchInterval: 5 * 60 * 1000,
    select: (balance) => ethers.BigNumber.from(balance),
  });
}
