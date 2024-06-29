import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Button, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { useAccounts } from './useAccounts';
import { useCoreProxy } from './useCoreProxy';
import { useSelectedAccountId } from './useSelectedAccountId';

function shortAccount(accountId?: string) {
  if (!accountId) {
    return '---';
  }
  const hex = ethers.BigNumber.from(accountId).toHexString();
  // auto-generated 0x80000000000000000000000000000008 value
  if (hex.length === 34) {
    return `0x...${hex.slice(-4)}`;
  }
  return accountId;
}

export function Accounts() {
  const [params, setParams] = useParams();
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: accounts } = useAccounts();
  const queryClient = useQueryClient();
  const { data: CoreProxyContract } = useCoreProxy();
  const accountId = useSelectedAccountId();

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
      {accounts && accounts.length > 0 ? (
        <Menu>
          <MenuButton as={Button} variant="text" rightIcon={<ChevronDownIcon />}>
            Account {shortAccount(accountId)}
          </MenuButton>
          <MenuList>
            {accounts &&
              accounts.map((id) => (
                <MenuItem
                  key={id}
                  type="button"
                  icon={accountId === id ? <ChevronRightIcon /> : undefined}
                  onClick={() => setParams({ ...params, accountId: id })}
                >
                  {shortAccount(id)}
                </MenuItem>
              ))}
            {accounts && !accounts.length ? <MenuItem>No accounts</MenuItem> : null}
          </MenuList>
        </Menu>
      ) : (
        <Button type="button" onClick={() => createAccount.mutate()}>
          Create account
        </Button>
      )}
    </>
  );
}
