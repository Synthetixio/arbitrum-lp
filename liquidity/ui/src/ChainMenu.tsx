import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  useDisclosure,
} from '@chakra-ui/react';
import { useSetChain } from '@web3-onboard/react';
import React from 'react';
import { useLocation } from 'react-router-dom';

export function ChainMenu() {
  const { onClose } = useDisclosure();
  const location = useLocation();

  React.useEffect(() => {
    onClose();
  }, [location, onClose]);

  const [{ chains, connectedChain }, setChain] = useSetChain();

  const chain = React.useMemo(() => {
    const connectedAndSupported = chains.find((chain) => chain.id === connectedChain?.id);
    if (connectedAndSupported) {
      return connectedAndSupported;
    }
    return chains[0];
  }, [chains, connectedChain?.id]);

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
              defaultValue={chain.id ?? ''}
              value={chain.id ?? ''}
              onChange={(chainId) => setChain({ chainId: `${chainId}` })}
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
