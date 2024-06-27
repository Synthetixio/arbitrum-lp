import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { useAccounts } from './useAccounts';
import { useCoreProxy } from './useCoreProxy';

export function Accounts() {
  const [params, setParams] = useParams();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: accounts } = useAccounts();
  const queryClient = useQueryClient();
  const { data: CoreProxyContract } = useCoreProxy();

  const createAccount = useMutation({
    mutationFn: async () => {
      if (!(connectedChain?.id && CoreProxyContract && walletAddress && wallet?.provider))
        throw 'OMFG';
      const provider = new ethers.providers.Web3Provider(wallet.provider);
      const signer = provider.getSigner(walletAddress);
      const CoreProxy = new ethers.Contract(
        CoreProxyContract.address,
        CoreProxyContract.abi,
        signer
      );
      const tx: ethers.ContractTransaction = await CoreProxy['createAccount()']();
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
          queryClient.setQueryData(
            [connectedChain.id, walletAddress, 'Accounts'],
            (oldData: string[]) => oldData.concat([accountId])
          );
          setParams({ ...params, accountId });
        }
      }

      return txResult;
    },
  });

  return (
    <>
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Accounts
      </Heading>
      <Flex flexDir="column" gap={3} alignItems="flex-start">
        <Button type="button" onClick={() => createAccount.mutate()}>
          Create account
        </Button>
        {accounts &&
          accounts.map((accountId) => (
            <Button
              key={accountId}
              type="button"
              variant={params?.accountId === accountId ? undefined : 'outline'}
              onClick={() => setParams({ ...params, accountId })}
            >
              {accountId}
            </Button>
          ))}
        {accounts && !accounts.length ? <Text as="span">No accounts</Text> : null}
      </Flex>
    </>
  );
}
