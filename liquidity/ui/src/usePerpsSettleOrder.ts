import { useErrorParser, useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

export function usePerpsSettleOrder() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const perpsAccountId = usePerpsSelectedAccountId();
  const queryClient = useQueryClient();
  const errorParser = useErrorParser();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useMutation({
    mutationFn: async () => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && walletAddress && wallet?.provider && perpsAccountId)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);
      const tx = await PerpsMarketProxy.settleOrder(perpsAccountId);
      const txResult = await tx.wait();

      return txResult;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          { PerpsMarketProxy: PerpsMarketProxyContract?.address },
          perpsAccountId,
          { walletAddress },
          'PerpsGetOpenPosition',
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId, 'PerpsGetOrder'],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId, 'PerpsGetAvailableMargin'],
      });
    },
  });
}
