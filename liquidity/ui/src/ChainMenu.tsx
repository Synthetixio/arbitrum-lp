import { ChevronDownIcon } from '@chakra-ui/icons';
import { Button, Menu, MenuButton, MenuItemOption, MenuList, MenuOptionGroup } from '@chakra-ui/react';
import { useSynthetix } from '@synthetixio/react-sdk';
import { useSetChain } from '@web3-onboard/react';
import React from 'react';

export function ChainMenu() {
  const [{ chains, connectedChain }, setChain] = useSetChain();
  const { chainId, setChainId } = useSynthetix();
  const chain = React.useMemo(() => chains.find((chain) => Number.parseInt(chain.id, 16) === chainId) || chains[0], [chainId, chains]);

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
                  const nextChain = chains.find((chain) => chain.id === `${id}`);
                  const nextChainId = nextChain ? nextChain.id : chains[0].id;
                  setChainId(Number.parseInt(nextChainId, 16));
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
