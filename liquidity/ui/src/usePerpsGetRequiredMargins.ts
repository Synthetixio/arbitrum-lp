import { useImportContract, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { perpsFetchRequiredMargins } from './perpsFetchRequiredMargins';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';

export function usePerpsGetRequiredMargins() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && perpsAccountId),
    queryKey: [chainId, { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId, 'PerpsGetRequiredMargins'],
    queryFn: async () => {
      if (!(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && perpsAccountId)) {
        throw 'OMFG';
      }

      return await perpsFetchRequiredMargins({
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
