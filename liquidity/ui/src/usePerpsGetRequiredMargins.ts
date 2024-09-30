import { useParams } from '@snx-v3/useParams';
import { useImportContract, usePerpsSelectedAccountId, useSynthetix } from '@synthetixio/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { perpsFetchRequiredMargins } from './perpsFetchRequiredMargins';
import { useProvider } from './useProvider';

export function usePerpsGetRequiredMargins() {
  const { chainId } = useSynthetix();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const [params] = useParams();
  const provider = useProvider();
  const perpsAccountId = usePerpsSelectedAccountId({ provider, walletAddress, perpsAccountId: params.perpsAccountId });
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const isChainReady = connectedChain?.id && chainId && chainId === Number.parseInt(connectedChain?.id, 16);

  return useQuery({
    enabled: Boolean(isChainReady && PerpsMarketProxyContract?.address && wallet?.provider && perpsAccountId),
    queryKey: [chainId, 'PerpsGetRequiredMargins', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
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
