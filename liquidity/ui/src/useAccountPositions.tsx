import { useImportContract } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { useSelectedAccountId } from './useSelectedAccountId';
import { fetchAccountPosition } from './fetchAccountPosition';
import { ethers} from 'ethers';

export function useAccountPositions({ marketIds }: { marketIds: ethers.BigNumber[] }) {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const accountId = useSelectedAccountId();

  return useQuery({
    enabled: Boolean(connectedChain?.id && accountId && marketIds.length > 0 && wallet?.provider && PerpsMarketProxyContract),
    queryKey: [connectedChain?.id, 'AccountPositions', accountId, ...marketIds],
    queryFn: async () => {
      if (!(connectedChain?.id && accountId && wallet?.provider && marketIds.length > 0 && PerpsMarketProxyContract)) throw 'OMFG';
      const positions = []
      for (let i = 0; i < marketIds.length; i++) {
        positions.push(fetchAccountPosition( { wallet, PerpsMarketProxyContract, accountId, marketId: marketIds[i] }));
      }
      await Promise.all(positions);
      return positions;
    }
  });
}
