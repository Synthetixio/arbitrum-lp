import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import React, { useEffect, useState } from 'react';
import './i18n/config';
import { useTranslation } from 'react-i18next';
import { ChainMenu } from './ChainMenu';

interface Account {
  address: string;
}

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng).catch((err) => console.log('something went wrong loading', err));
  };

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
        {currentLanguage === 'en' ? 'EN' : 'UA'}
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => changeLanguage('en')}>EN</MenuItem>
        <MenuItem onClick={() => changeLanguage('ua')}>UA</MenuItem>
      </MenuList>
    </Menu>
  );
}

function WalletConnector() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [account, setAccount] = useState<Account | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (wallet?.provider) {
      setAccount({
        address: wallet.accounts[0].address,
      });
    }
  }, [wallet]);

  if (wallet?.provider && account) {
    return (
      <Menu>
        <MenuButton as={Button} variant="text" rightIcon={<ChevronDownIcon />}>
          {account.address.slice(0, 5)}...{account.address.slice(-3)}
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => navigator.clipboard.writeText(account?.address)}>{t('Copy address')}</MenuItem>
          <MenuItem onClick={() => disconnect({ label: wallet.label })}>{t('Disconnect')}</MenuItem>
        </MenuList>
      </Menu>
    );
  }

  return !wallet ? (
    <Button disabled={connecting} onClick={() => connect()}>
      {t('Connect')}
    </Button>
  ) : null;
}

const ChainHandler = () => {
  const [{ wallet }] = useConnectWallet();
  const [{ chains, connectedChain }, setChain] = useSetChain();

  const isChainSupported = React.useMemo(() => {
    return chains.some((chain) => chain.id === connectedChain?.id);
  }, [chains, connectedChain?.id]);

  return (
    <>
      {wallet && !isChainSupported ? (
        <Button type="button" onClick={() => setChain({ chainId: chains[0].id })}>
          Switch to {chains[0].label}
        </Button>
      ) : null}
    </>
  );
};

export function PerpsAppNavbar() {
  return (
    <Box>
      <Flex
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
      >
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Text textAlign={useBreakpointValue({ base: 'center', md: 'left' })} fontFamily={'heading'}>
            Logo
          </Text>
        </Flex>
        <Stack flex={{ base: 1, md: 0 }} justify={'flex-end'} direction={'row'} spacing={6}>
          <ChainHandler />
          <WalletConnector />
          <ChainMenu />
          <LanguageSwitcher />
        </Stack>
      </Flex>
    </Box>
  );
}
