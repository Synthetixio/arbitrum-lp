import { useParams } from '@snx-v3/useParams';
import {
  fetchApproveToken,
  fetchTokenAllowance,
  fetchTokenBalance,
  useErrorParser,
  useImportContract,
  useImportSystemToken,
  usePerpsSelectedAccountId,
  useSynthetix,
} from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { useProvider } from './useProvider';

const USDx_MARKET_ID = 0;

export function usePerpsModifyCollateral() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const [params] = useParams();
  const provider = useProvider();
  const perpsAccountId = usePerpsSelectedAccountId({ provider, walletAddress, perpsAccountId: params.perpsAccountId });
  const queryClient = useQueryClient();
  const errorParser = useErrorParser();
  const { data: systemToken } = useImportSystemToken();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useMutation({
    mutationFn: async (depositAmount: ethers.BigNumber) => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && walletAddress && provider && perpsAccountId && systemToken)) {
        throw 'OMFG';
      }
      if (depositAmount.lte(0)) {
        throw new Error('Amount required');
      }

      const freshBalance = await fetchTokenBalance({
        provider,
        ownerAddress: walletAddress,
        tokenAddress: systemToken?.address,
      });

      if (freshBalance.lt(depositAmount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        provider,
        ownerAddress: walletAddress,
        tokenAddress: systemToken.address,
        spenderAddress: PerpsMarketProxyContract.address,
      });

      console.log('freshAllowance', freshAllowance);

      if (freshAllowance.lt(depositAmount)) {
        await fetchApproveToken({
          provider,
          walletAddress,
          tokenAddress: systemToken.address,
          spenderAddress: PerpsMarketProxyContract.address,
          allowance: depositAmount.sub(freshAllowance),
        });
      }

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
        queryKey: [chainId, 'Perps GetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
    },
  });
}
