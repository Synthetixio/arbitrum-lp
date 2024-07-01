import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  useDisclosure,
} from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { renderAccountId } from './renderAccountId';
import { useAccounts } from './useAccounts';
import { useCreateAccount } from './useCreateAccount';
import { useSelectedAccountId } from './useSelectedAccountId';

export function UserMenu() {
  const { onClose } = useDisclosure();
  const location = useLocation();

  React.useEffect(() => {
    onClose();
  }, [location, onClose]);

  const [{ chains, connectedChain }, setChain] = useSetChain();
  const [{ wallet }, connect, disconnect] = useConnectWallet();

  const isChainSupported = React.useMemo(() => {
    return chains.some((chain) => chain.id === connectedChain?.id);
  }, [chains, connectedChain?.id]);

  const [params, setParams] = useParams();
  const { data: accounts } = useAccounts();
  const createAccount = useCreateAccount();
  const accountId = useSelectedAccountId();

  return (
    <>
      {!wallet ? (
        <Button type="button" onClick={() => connect()}>
          Connect
        </Button>
      ) : null}
      {wallet && !isChainSupported ? (
        <Button type="button" onClick={() => setChain({ chainId: chains[0].id })}>
          Switch to {chains[0].label}
        </Button>
      ) : null}
      {accounts && !accounts.length ? (
        <Button type="button" onClick={() => createAccount.mutate()}>
          Create account
        </Button>
      ) : null}

      {wallet?.accounts?.[0]?.address ? (
        <Menu>
          <MenuButton as={Button} variant="text" rightIcon={<ChevronDownIcon />}>
            {wallet.accounts[0].address.slice(0, 5)} ... {wallet.accounts[0].address.slice(-3)}
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => navigator.clipboard.writeText(wallet.accounts[0].address)}>
              Copy address
            </MenuItem>

            {accounts && accounts.length > 0 ? (
              <>
                <MenuDivider />
                <MenuOptionGroup
                  title="Accounts"
                  type="radio"
                  defaultValue={accountId?.toHexString() ?? ''}
                  value={accountId?.toHexString() ?? ''}
                  onChange={(value) => setParams({ ...params, accountId: `${value}` })}
                >
                  {accounts.map((id) => (
                    <MenuItemOption key={id.toHexString()} value={id.toHexString()}>
                      {renderAccountId(id)}
                    </MenuItemOption>
                  ))}
                </MenuOptionGroup>
              </>
            ) : null}
            {accounts && !accounts.length ? (
              <>
                <MenuDivider />
                <MenuOptionGroup title="Accounts" type="radio" defaultValue="0">
                  <MenuItemOption value="0">No accounts</MenuItemOption>
                </MenuOptionGroup>
              </>
            ) : null}

            <MenuDivider />
            <MenuItem onClick={() => disconnect({ label: wallet.label })}>Disconnect</MenuItem>
          </MenuList>
        </Menu>
      ) : null}
    </>
  );
}