import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useSetChain } from '@web3-onboard/react';
import React from 'react';
import { useChain } from './useChain';

export function ChainMenu() {
  const [{ chains, connectedChain }, setChain] = useSetChain();
  const { data: chain } = useChain();
  const queryClient = useQueryClient();
  React.useEffect(() => {
    if (connectedChain?.id) {
      queryClient.setQueryData(
        ['chain'],
        chains.find((chain) => chain.id === connectedChain?.id) || chains[0]
      );
    }
  }, [connectedChain?.id]);

  return (
    <Menu>
      <MenuButton as={Button} variant="text" rightIcon={<ChevronDownIcon />}>
        {chain ? chain.label : 'Networks'}
      </MenuButton>
      <MenuList>
        {chains && chains.length > 0 ? (
          <>
            <MenuOptionGroup
              title="Networks"
              type="radio"
              defaultValue={chain.id}
              value={chain.id}
              onChange={(id) => {
                if (connectedChain?.id) {
                  setChain({ chainId: `${id}` });
                } else {
                  queryClient.setQueryData(
                    ['chain'],
                    chains.find((chain) => chain.id === `${id}`) || chains[0]
                  );
                }
              }}
            >
              {chains.map(({ id, label }) => (
                <MenuItemOption key={id} value={id}>
                  {label}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
          </>
        ) : null}
      </MenuList>
    </Menu>
  );
}
