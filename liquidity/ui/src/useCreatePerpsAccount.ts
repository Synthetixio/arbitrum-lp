import { useParams } from '@snx-v3/useParams';
import { useImportContract } from '@synthetixio/react-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';

export function useCreatePerpsAccount() {
  const [params, setParams] = useParams();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const queryClient = useQueryClient();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  return useMutation({
    mutationFn: async () => {
      if (!(connectedChain?.id && PerpsMarketProxyContract && walletAddress && wallet?.provider)) throw 'OMFG';
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);
      const tx: ethers.ContractTransaction = await PerpsMarketProxy['createAccount()']();
      console.log({ tx });
      if (window.$tx) {
        window.$tx.push(tx);
      } else {
        window.$tx = [tx];
      }
      const txResult = await tx.wait();
      console.log({ txResult });
      if (window.$txResult) {
        window.$txResult.push(txResult);
      } else {
        window.$txResult = [txResult];
      }

      const event = txResult.events?.find((e) => e.event === 'AccountCreated');
      if (event) {
        const accountId = event?.args?.accountId?.toString();
        if (accountId) {
          queryClient.setQueryData([connectedChain.id, 'PerpsAccounts', { ownerAddress: walletAddress }], (oldData: string[]) =>
            oldData.concat([accountId])
          );
          setParams({ ...params, accountId: accountId.toHexString() });
        }
      }

      return txResult;
    },
  });
}
