import { ChakraProvider, Container, Flex, Link, useColorMode, useDisclosure } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { SynthetixProvider, useAccounts, useErrorParser, useSynthetix } from '@synthetixio/react-sdk';
// import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
// import { get, set, del } from 'idb-keyval'
// import {
//   PersistedClient,
//   Persister,
// } from '@tanstack/react-query-persist-client'
import injectedModule, { ProviderLabel } from '@web3-onboard/injected-wallets';
import { Web3OnboardProvider, init, useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React, { useEffect } from 'react';
import { HashRouter, Outlet, Route, NavLink as RouterLink, Routes } from 'react-router-dom';
import { ChainMenu } from './ChainMenu';
import { Fonts } from './Fonts';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { PerpsApp } from './PerpsApp';
import SynthetixIcon from './SynthetixIcon.svg';
import SynthetixLogo from './SynthetixLogo.svg';
import { TermsModal } from './TermsModal';
import { UserMenu } from './UserMenu';
import DiscordIcon from './discord.svg';
import GithubIcon from './github.svg';
import LogoIcon from './logo-icon.svg';
import Logo from './logo.svg';
import { theme } from './theme';
import { useProvider } from './useProvider';
import WarpcastIcon from './warpcast.svg';
import XIcon from './x.svg';
import YoutubeIcon from './youtube.svg';

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
  wallets: [injectedModule()],
  chains: [
    {
      id: 42161,
      token: 'ETH',
      label: 'Arbitrum One',
      rpcUrl: `wss://arbitrum-mainnet.infura.io/ws/v3/${process.env.INFURA_KEY}`,
      publicRpcUrl: 'https:8//arb1.arbitrum.io/rpc',
    },
    {
      id: 421614,
      token: 'ETH',
      label: 'Arbitrum Sepolia',
      rpcUrl: `wss://arbitrum-sepolia.infura.io/ws/v3/${process.env.INFURA_KEY}`,
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

window.$ethers = ethers;

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
  var $ethers: any;
  var $parseErrorData: (data: string) => void;
  var $provider: ethers.providers.Web3Provider;
  var $signer: ethers.Signer;
  var $tx: ethers.ContractTransaction[];
  var $txResult: ethers.ContractReceipt[];
}

function Layout() {
  return (
    <Flex as="main" minHeight="100vh" flexDirection="column" bg="navy.900" gap={10}>
      <Flex bg="navy.700" borderBottomWidth={1} borderBottomColor="gray.900">
        <Container as={Flex} maxW="1236px" py={3} px={10} minHeight="72px" justifyContent="space-between" alignItems="center">
          <Link
            to={{
              pathname: '/',
              search: location.search,
            }}
            as={RouterLink}
            py={4}
          >
            <img src={Logo} alt="Synthetix" />
          </Link>
          <Link
            to={{
              pathname: '/perps-app',
              search: location.search,
            }}
            as={RouterLink}
            py={4}
          >
            Perps App
          </Link>
          <Flex gap={3} flexWrap="wrap-reverse" justifyContent="center" alignItems="center">
            <UserMenu />
            <ChainMenu />
          </Flex>
        </Container>
      </Flex>

      <Flex bg="navy.900" flex={1}>
        <Container as={Flex} maxW="1236px" py={3} px={10}>
          <Outlet />
        </Container>
      </Flex>

      <Flex bg="navy.700" borderTopWidth={1} borderTopColor="gray.900">
        <Container as={Flex} maxW="1236px" py={3} px={10} height="72px" alignItems="center" justifyContent="space-between">
          <img src={LogoIcon} alt="Synthetix" />
          <Flex alignItems="center" gap={2}>
            <Link href="https://discord.com/invite/synthetix" target="_blank">
              <img src={DiscordIcon} alt="Synthetix Discord" />
            </Link>
            <Link href="https://x.com/synthetix_io" target="_blank">
              <img src={XIcon} alt="Synthetix Discord" />
            </Link>
            <Link href="https://github.com/Synthetixio/" target="_blank">
              <img src={GithubIcon} alt="Synthetix Discord" />
            </Link>
            <Link href="https://warpcast.com/~/channel/synthetix" target="_blank">
              <img src={WarpcastIcon} alt="Synthetix Discord" />
            </Link>
            <Link href="https://www.youtube.com/@synthetix.v3" target="_blank">
              <img src={YoutubeIcon} alt="Synthetix Discord" />
            </Link>
          </Flex>
        </Container>
      </Flex>
    </Flex>
  );
}

function Router() {
  useDarkColors();

  const { onClose } = useDisclosure();
  React.useEffect(() => {
    onClose();
  }, [onClose]);

  const [{ wallet }] = useConnectWallet();
  if (wallet?.provider && wallet?.accounts?.[0]?.address) {
    window.$provider = new ethers.providers.Web3Provider(wallet.provider);
    window.$signer = window.$provider.getSigner(wallet?.accounts?.[0]?.address);
  }

  const errorParser = useErrorParser();
  window.$parseErrorData = (data) => {
    errorParser(Object.assign(new Error('OMFG'), { data }));
  };

  // Initial account pre-selection
  const [params, setParams] = useParams();
  const provider = useProvider();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: accounts } = useAccounts({ provider, walletAddress });
  React.useEffect(() => {
    if (!accounts) {
      return;
    }
    if (!('accountId' in params) && accounts.length >= 1) {
      const [firstAccount] = accounts;
      setParams({ ...params, accountId: firstAccount.toHexString() });
      return;
    }
    if ('accountId' in params && accounts.length < 1) {
      const { accountId: _accountId, ...newParams } = params;
      setParams(newParams);
      return;
    }
    if ('accountId' in params && accounts.length >= 1) {
      const accountId = ethers.BigNumber.from(params.accountId);
      if (!accounts.find((id) => id.eq(accountId))) {
        const [firstAccount] = accounts;
        setParams({ ...params, accountId: firstAccount.toHexString() });
        return;
      }
    }
  }, [params?.accountId, accounts, params, setParams]);

  const [{ connectedChain }] = useSetChain();
  const { setChainId } = useSynthetix();
  React.useEffect(() => {
    if (connectedChain?.id) {
      setChainId(Number.parseInt(connectedChain?.id, 16));
    }
  }, [connectedChain?.id, setChainId]);

  return (
    <Routes>
      <Route path="/perps-app" element={<PerpsApp />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <QueryClientProvider client={queryClient} persistOptions={{ persister: createSyncStoragePersister({ storage: window.localStorage }) }}>*/}
      <Web3OnboardProvider web3Onboard={onboard}>
        <SynthetixProvider chainId={42161} preset="main" queryClient={queryClient}>
          <ChakraProvider theme={theme}>
            <HashRouter>
              <Router />
              <TermsModal defaultOpen={window.sessionStorage.getItem('TERMS_CONDITIONS_ACCEPTED') !== 'true'} />
            </HashRouter>
            <ReactQueryDevtools />
            <Fonts />
          </ChakraProvider>
        </SynthetixProvider>
      </Web3OnboardProvider>
    </QueryClientProvider>
  );
}
