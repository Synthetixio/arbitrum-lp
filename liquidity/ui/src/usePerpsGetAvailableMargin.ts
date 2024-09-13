import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { perpsFetchAvailableMargin } from './perpsFetchAvailableMargin';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

export function usePerpsGetAvailableMargin() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && perpsAccountId),
    queryKey: [chainId, 'PerpsGetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
    queryFn: async () => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && perpsAccountId)) {
        throw 'OMFG';
      }

      return await perpsFetchAvailableMargin({
        wallet,
        PerpsMarketProxyContract,
        accountId: perpsAccountId,
      });
    },
    throwOnError: (error) => {
      console.error(error);
      return false;
    },
  });
}
