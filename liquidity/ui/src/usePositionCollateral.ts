import { useErrorParser, useImportContract } from '@synthetixio/react-sdk';
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
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  return useQuery({
    enabled: Boolean(connectedChain?.id && wallet?.provider && CoreProxyContract && accountId && poolId && tokenAddress),
    queryKey: [
      connectedChain?.id,
      'PositionCollateral',
      {
        accountId: accountId?.toHexString(),
        poolId: poolId?.toHexString(),
        tokenAddress,
      },
    ],
    queryFn: async () => {
      if (!(connectedChain?.id && wallet?.provider && CoreProxyContract && accountId && poolId && tokenAddress)) {
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
