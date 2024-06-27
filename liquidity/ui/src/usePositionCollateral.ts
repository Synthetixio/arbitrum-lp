import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { useCoreProxy } from './useCoreProxy';

export function usePositionCollateral({
  accountId,
  poolId,
  tokenAddress,
}: {
  accountId?: string;
  poolId?: string;
  tokenAddress?: string;
}) {
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
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const CoreProxy = new ethers.Contract(
        CoreProxyContract.address,
        CoreProxyContract.abi,
        provider
      );
      const positionCollateral = await CoreProxy.getPositionCollateral(
        accountId,
        poolId,
        tokenAddress
      );
      return positionCollateral;
    },
  });
}
