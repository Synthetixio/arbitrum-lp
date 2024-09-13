import { useErrorParser, useImportContract, useImportSystemToken, useSynthetix } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { approveToken } from './approveToken';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { fetchTokenBalance } from './fetchTokenBalance';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

const USDx_MARKET_ID = 0;

export function usePerpsModifyCollateral() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const perpsAccountId = usePerpsSelectedAccountId();
  const queryClient = useQueryClient();
  const errorParser = useErrorParser();
  const { data: systemToken } = useImportSystemToken();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useMutation({
    mutationFn: async (depositAmount: ethers.BigNumber) => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && walletAddress && wallet?.provider && perpsAccountId && systemToken)) {
        throw 'OMFG';
      }
      if (depositAmount.lte(0)) {
        throw new Error('Amount required');
      }

      const freshBalance = await fetchTokenBalance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress: systemToken?.address,
      });

      if (freshBalance.lt(depositAmount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        wallet,
        ownerAddress: walletAddress,
        tokenAddress: systemToken.address,
        spenderAddress: PerpsMarketProxyContract.address,
      });

      console.log('freshAllowance', freshAllowance);

      if (freshAllowance.lt(depositAmount)) {
        await approveToken({
          wallet,
          tokenAddress: systemToken.address,
          spenderAddress: PerpsMarketProxyContract.address,
          allowance: depositAmount.sub(freshAllowance),
        });
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);

      const modifyCollateralTxnArgs = [perpsAccountId, USDx_MARKET_ID, depositAmount];
      const tx = await PerpsMarketProxy.modifyCollateral(...modifyCollateralTxnArgs);
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
          'GetPerpsCollateralAmount',
          { PerpsMarketProxy: PerpsMarketProxyContract?.address },
          { collateral: USDx_MARKET_ID },
          perpsAccountId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [chainId, 'Balance', { tokenAddress: systemToken?.address, ownerAddress: walletAddress }],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'PerpsGetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
    },
  });
}
