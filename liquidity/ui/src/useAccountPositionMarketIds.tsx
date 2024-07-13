import { useImportContract } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { useSelectedAccountId } from './useSelectedAccountId';
import { fetchAccountPositionMarketIds } from './fetchAccountPositionMarketIds';
import { ethers } from 'ethers';

export function useAccountPositionMarketIds() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const accountId = useSelectedAccountId();

  return useQuery({
    enabled: Boolean(connectedChain?.id && accountId && wallet?.provider && PerpsMarketProxyContract),
    queryKey: [connectedChain?.id, 'AccountPositionMarketIds', accountId],
    queryFn: async () => {
      if (!(connectedChain?.id && accountId && wallet?.provider && PerpsMarketProxyContract)) throw 'OMFG';
      return await fetchAccountPositionMarketIds( { wallet, PerpsMarketProxyContract, accountId });
    },
    select: (marketIds) => marketIds.map((marketId) => ethers.BigNumber.from(marketId)),
  });
}
