import { useErrorParser, useImportContract, useImportExtras, useImportSystemToken, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { approveToken } from './approveToken';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useCollateralTokens } from './useCollateralTokens';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

export function usePerpsSellSETHToUSDX({ onSuccess }: { onSuccess: () => void }) {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  const perpsAccountId = usePerpsSelectedAccountId();
  const queryClient = useQueryClient();
  const errorParser = useErrorParser();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const { data: SpotMarketProxyContract } = useImportContract('SpotMarketProxy');
  const { data: systemToken } = useImportSystemToken();
  const { data: extras } = useImportExtras();
  const collateralTokens = useCollateralTokens();
  const tokenWETH = extras && collateralTokens?.find((token) => token.address === extras.weth_address);

  return useMutation({
    mutationFn: async (amount: ethers.BigNumber) => {
      if (
        !(
          isChainReady &&
          SpotMarketProxyContract?.address &&
          PerpsMarketProxyContract?.address &&
          walletAddress &&
          wallet?.provider &&
          perpsAccountId &&
          tokenWETH &&
          extras &&
          systemToken
        )
      ) {
        throw 'OMFG';
      }

      if (amount.lte(0)) {
        throw new Error('Amount required');
      }

      const freshBalance = await fetchTokenBalance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress: extras?.synth_eth_token_address,
      });

      if (freshBalance.lt(amount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress: extras?.synth_eth_token_address,
        spenderAddress: SpotMarketProxyContract.address,
      });

      if (freshAllowance.lt(amount)) {
        await approveToken({
          wallet,
          tokenAddress: extras?.synth_eth_token_address,
          spenderAddress: SpotMarketProxyContract.address,
          allowance: amount.sub(freshAllowance),
        });
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const SpotMarketProxy = new ethers.Contract(SpotMarketProxyContract.address, SpotMarketProxyContract.abi, signer);
      const args = [extras.synth_eth_market_id, amount, amount, ethers.constants.AddressZero];

      console.log('args', args);

      const tx = await SpotMarketProxy.sell(...args);
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
        queryKey: [chainId, 'Balance', { tokenAddress: systemToken?.address, ownerAddress: walletAddress }],
      });

      queryClient.invalidateQueries({
        queryKey: [chainId, 'Balance', { tokenAddress: extras?.synth_eth_token_address, ownerAddress: walletAddress }],
      });

      onSuccess();
    },
  });
}
