import {
  Box,
  ChakraProvider,
  Container,
  Flex,
  Link,
  useColorMode,
  useDisclosure,
} from '@chakra-ui/react';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import coinbaseModule from '@web3-onboard/coinbase';
import gnosisModule from '@web3-onboard/gnosis';
import injectedModule, { ProviderLabel } from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import { init, useConnectWallet, Web3OnboardProvider } from '@web3-onboard/react';
import trezorModule from '@web3-onboard/trezor';
import walletConnectModule from '@web3-onboard/walletconnect';
import { ethers } from 'ethers';
import React, { useEffect } from 'react';
import {
  HashRouter,
  NavLink as RouterLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { DiscordIcon } from './DiscordIcon';
import { Fonts } from './Fonts';
import { GithubIcon } from './GithubIcon';
import { HomePage } from './HomePage';
import { Logo } from './Logo';
import { NotFoundPage } from './NotFoundPage';
import SynthetixIcon from './SynthetixIcon.svg';
import SynthetixLogo from './SynthetixLogo.svg';
import { TermsModal } from './TermsModal';
import { theme } from './theme';
import { UserMenu } from './UserMenu';
import { WarpcastIcon } from './WarpcastIcon';
import { XIcon } from './XIcon';
import { YoutubeIcon } from './YoutubeIcon';

export const appMetadata = {
  name: 'Synthetix Liquidity',
  icon: SynthetixIcon,
  logo: SynthetixLogo,
  description: 'Synthetix | The derivatives liquidity protocol.',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' },
    { name: 'Brave Wallet', url: 'https://brave.com/wallet' },
  ],
  gettingStartedGuide: 'https://synthetix.io',
  explore: 'https://blog.synthetix.io',
};
export const onboard = init({
  connect: {
    autoConnectLastWallet: true,
    autoConnectAllPreviousWallet: true,
  },
  wallets: [
    coinbaseModule(),
    injectedModule({
      displayUnavailable: [ProviderLabel.MetaMask, ProviderLabel.Trust],
    }),
    trezorModule({
      appUrl: 'https://liquidity.synthetix.eth.limo',
      email: 'info@synthetix.io',
    }),
    ledgerModule({
      projectId: 'd6eac005846a1c3be1f8eea3a294eed9',
      walletConnectVersion: 2,
    }),
    walletConnectModule({
      version: 2,
      projectId: 'd6eac005846a1c3be1f8eea3a294eed9',
      dappUrl: 'liquidity.synthetix.eth.limo',
    }),
    gnosisModule(),
  ],
  chains: [
    {
      id: 42161,
      token: 'ETH',
      label: 'Arbitrum One',
      rpcUrl: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      publicRpcUrl: 'https://arb1.arbitrum.io/rpc',
    },
    {
      id: 421614,
      token: 'ETH',
      label: 'Arbitrum Sepolia',
      rpcUrl: `https://arbitrum-sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      publicRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    },
  ],
  appMetadata,
  accountCenter: {
    desktop: {
      enabled: false,
    },
    mobile: {
      enabled: false,
    },
  },
  notify: {
    enabled: true,
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchInterval: false, //  if queries needs refetching we should be explicit about it, given erc7412
      staleTime: 5 * 60 * 1000,
      gcTime: 60 * 60 * 1000, // 1h
      refetchOnWindowFocus: false,
      throwOnError: (queryError) => {
        console.error({ queryError });
        return false;
      },
    },
    mutations: {
      retry: false,
      throwOnError: (mutationError) => {
        console.error({ mutationError });
        return false;
      },
    },
  },
});
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

function useDarkColors() {
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    if (colorMode === 'light') {
      toggleColorMode();
    }
  }, [colorMode, toggleColorMode]);
  return null;
}

declare global {
  var ethers: any;
  var $provider: ethers.providers.Web3Provider;
  var $signer: ethers.Signer;
  var $tx: ethers.ContractTransaction[];
  var $txResult: ethers.ContractReceipt[];
}
window.ethers = ethers;

function Layout() {
  return (
    <Box
      as="main"
      minHeight="100vh"
      color="rgba(255,255,255,0.85)"
      display="flex"
      flexDirection="column"
      bg="navy.900"
    >
      <Flex flex="1" flexDirection="column">
        <Flex
          bg="navy.700"
          mb="4"
          py="3"
          borderBottomWidth="1px"
          borderBottomColor="gray.900"
          px="10"
        >
          <Container maxW="1236px" as={Flex} justifyContent="space-between" alignItems="center">
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
            <Flex gap={3} flexWrap="wrap-reverse" justifyContent="center" alignItems="center">
              <UserMenu />
            </Flex>
          </Container>
        </Flex>
        <Container display="flex" flexDir="column" maxW="1236px" flex="1">
          <Outlet />
        </Container>

        <Flex borderTop="1px solid" borderTopColor="gray.900" bg="navy.700">
          <Container
            maxW="1236px"
            as={Flex}
            height="72px"
            alignItems="center"
            justifyContent="space-between"
          >
            <Logo withText={false} />
            <Flex alignItems="center">
              <Link href="https://discord.com/invite/synthetix" target="_blank">
                <DiscordIcon w="24px" h="24px" mr={2} />
              </Link>
              <Link href="https://x.com/synthetix_io" target="_blank">
                <XIcon w="24px" h="24px" mr={2} />
              </Link>
              <Link href="https://github.com/Synthetixio/" target="_blank">
                <GithubIcon w="24px" h="24px" mr={2} />
              </Link>
              <Link href="https://warpcast.com/~/channel/synthetix" target="_blank">
                <WarpcastIcon w="24px" h="24px" mr={2} />
              </Link>
              <Link href="https://www.youtube.com/@synthetix.v3" target="_blank">
                <YoutubeIcon w="24px" h="24px" />
              </Link>
            </Flex>
          </Container>
        </Flex>
      </Flex>
    </Box>
  );
}

function Router() {
  useDarkColors();

  const { onClose } = useDisclosure();
  const location = useLocation();
  React.useEffect(() => {
    onClose();
  }, [location, onClose]);

  const [{ wallet }] = useConnectWallet();
  if (wallet?.provider && wallet?.accounts?.[0]?.address) {
    window.$provider = new ethers.providers.Web3Provider(wallet.provider);
    window.$signer = window.$provider.getSigner(wallet?.accounts?.[0]?.address);
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: localStoragePersister }}
    >
      <Web3OnboardProvider web3Onboard={onboard}>
        <ChakraProvider theme={theme}>
          <HashRouter>
            <Router />
            <TermsModal
              defaultOpen={window.sessionStorage.getItem('TERMS_CONDITIONS_ACCEPTED') !== 'true'}
            />
          </HashRouter>
          <ReactQueryDevtools />
          <Fonts />
        </ChakraProvider>
      </Web3OnboardProvider>
    </PersistQueryClientProvider>
  );
}
