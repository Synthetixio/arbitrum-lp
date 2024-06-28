import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { fetchPositionCollateral } from './fetchPositionCollateral';
import { useCoreProxy } from './useCoreProxy';
import { useErrorParser } from './parseError';

export function usePositionCollateral({
  accountId,
  poolId,
  tokenAddress,
}: {
  accountId?: string;
  poolId?: string;
  tokenAddress?: string;
}) {
  const errorParser = useErrorParser();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: CoreProxyContract } = useCoreProxy();
  return useQuery({
    enabled: Boolean(
      connectedChain?.id &&
        wallet?.provider &&
        CoreProxyContract &&
        accountId &&
        poolId &&
        tokenAddress
    ),
    queryKey: [connectedChain?.id, 'PositionCollateral', { accountId, poolId, tokenAddress }],
    queryFn: async () => {
      if (
        !(
          connectedChain?.id &&
          wallet?.provider &&
          CoreProxyContract &&
          accountId &&
          poolId &&
          tokenAddress
        )
      ) {
        throw 'OMFG';
      }
      return fetchPositionCollateral({
        wallet,
        CoreProxyContract,
        accountId,
        poolId,
        tokenAddress,
        errorParser,
      });
    },
    select: (positionCollateral) => ethers.BigNumber.from(positionCollateral),
  });
}
