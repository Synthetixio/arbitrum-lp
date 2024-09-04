import { useErrorParser, useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchPositionCollateral } from './fetchPositionCollateral';

export function usePositionCollateral({
  accountId,
  poolId,
  tokenAddress,
}: {
  accountId?: ethers.BigNumber;
  poolId?: ethers.BigNumber;
  tokenAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && CoreProxyContract?.address && wallet?.provider && accountId && poolId && tokenAddress),
    queryKey: [
      chainId,
      { CoreProxy: CoreProxyContract?.address },
      {
        accountId: accountId?.toHexString(),
        poolId: poolId?.toHexString(),
        tokenAddress,
      },
      'PositionCollateral',
    ],
    queryFn: async () => {
      if (!(isChainReady && CoreProxyContract?.address && wallet?.provider && accountId && poolId && tokenAddress)) {
        throw 'OMFG';
      }
      return fetchPositionCollateral({
        wallet,
        CoreProxyContract,
        accountId,
        poolId,
        tokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (positionCollateral) => ethers.BigNumber.from(positionCollateral),
  });
}
