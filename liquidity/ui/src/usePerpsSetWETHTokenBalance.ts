import { useErrorParser, useImportExtras, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { useCollateralTokens } from './useCollateralTokens';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

export function usePerpsSetWETHTokenBalance({ onSuccess }: { onSuccess: () => void }) {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  const perpsAccountId = usePerpsSelectedAccountId();
  const queryClient = useQueryClient();
  const errorParser = useErrorParser();

  const { data: extras } = useImportExtras();
  const collateralTokens = useCollateralTokens();
  const tokenWETH = extras && collateralTokens?.find((token) => token.address === extras.weth_address);

  return useMutation({
    mutationFn: async (amount: ethers.BigNumber) => {
      if (!(isChainReady && walletAddress && wallet?.provider && perpsAccountId && tokenWETH)) {
        throw 'OMFG';
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const Token = new ethers.Contract(tokenWETH?.address, ['function deposit() payable'], signer);
      const tx = await Token.deposit({
        value: amount,
      });
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
        queryKey: [chainId, 'Balance', { tokenAddress: tokenWETH?.address, ownerAddress: walletAddress }],
      });

      queryClient.invalidateQueries({
        queryKey: [chainId, 'EthBalance', { ownerAddress: walletAddress }],
      });

      onSuccess();
    },
  });
}
