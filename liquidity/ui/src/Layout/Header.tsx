import { Box, Button, Container, Flex, Link, useDisclosure } from '@chakra-ui/react';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import React from 'react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { Accounts } from '../Accounts';
import { Logo } from './Logo';
import { LogoIcon } from './LogoIcon';

export default function Header() {
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

  return (
    <>
      <Flex
        bg="navy.700"
        mb="4"
        py="3"
        borderBottomWidth="1px"
        borderBottomColor="gray.900"
        px="10"
      >
        <Container maxW="1236px" as={Flex} justifyContent="space-between" alignItems="center">
          <Flex
            display={{ base: 'none', md: 'inline-block' }}
            flexDirection="row"
            justifyContent="space-between"
          >
            <Link
              to={{
                pathname: '/',
                search: location.search,
              }}
              as={RouterLink}
              py={4}
            >
              <Logo />
            </Link>
            {/*
            <Link
              ml={6}
              as={RouterLink}
              to={{
                pathname: '/dashboard',
                search: location.search,
              }}
              fontWeight={700}
              fontSize="14px"
              display="inline"
              px={3}
              py={2.5}
              textDecoration="none"
              color="gray.500"
              _hover={{ textDecoration: 'none' }}
              _activeLink={{ color: 'white' }}
            >
              Dashboard
            </Link>
            <Link
              ml={2.5}
              as={RouterLink}
              to={{
                pathname: '/pools',
                search: location.search,
              }}
              fontWeight={700}
              fontSize="14px"
              display="inline"
              textDecoration="none"
              px={3}
              py={2.5}
              color="gray.500"
              _hover={{ textDecoration: 'none' }}
              _activeLink={{ color: 'white' }}
            >
              Pools
            </Link>
          */}
          </Flex>
          <Box display={{ md: 'none' }}>
            <Link to="/" as={RouterLink} py={4} pr={2}>
              <LogoIcon />
            </Link>
          </Box>
          <Flex gap={3} flexWrap="wrap-reverse" justifyContent="center" alignItems="center">
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
            {wallet?.accounts?.[0]?.address ? (
              <Button
                type="button"
                variant="text"
                title={`Copy address`}
                onClick={() => navigator.clipboard.writeText(wallet.accounts[0].address)}
              >
                {wallet.accounts[0].address.slice(0, 5)} ... {wallet.accounts[0].address.slice(-3)}
              </Button>
            ) : null}
            <Accounts />
            {wallet ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => disconnect({ label: wallet.label })}
              >
                Disconnect
              </Button>
            ) : null}
          </Flex>
        </Container>
      </Flex>
    </>
  );
}
