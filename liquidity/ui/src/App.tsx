import { ChakraProvider, useColorMode } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import coinbaseModule from '@web3-onboard/coinbase';
import gnosisModule from '@web3-onboard/gnosis';
import injectedModule, { ProviderLabel } from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import { init, Web3OnboardProvider } from '@web3-onboard/react';
import trezorModule from '@web3-onboard/trezor';
import walletConnectModule from '@web3-onboard/walletconnect';
import { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Router } from './Router';
import SynthetixIcon from './SynthetixIcon.svg';
import SynthetixLogo from './SynthetixLogo.svg';
import { TermsModal } from './TermsModal';
import { Fonts, theme } from './theme';

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
    enabled: false,
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false, //  if queries needs refetching we should be explicit about it, given erc7412
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      throwOnError: (e) => {
        console.error(e);
        return false;
      },
    },
    mutations: {
      throwOnError: (e) => {
        console.error(e);
        return false;
      },
    },
  },
});

function ColorMode() {
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    if (colorMode === 'light') {
      toggleColorMode();
    }
  }, [colorMode, toggleColorMode]);
  return null;
}

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3OnboardProvider web3Onboard={onboard}>
        <ChakraProvider theme={theme}>
          <ColorMode />
          <Fonts />
          <HashRouter>
            <TermsModal
              defaultOpen={window.sessionStorage.getItem('TERMS_CONDITIONS_ACCEPTED') !== 'true'}
            />
            <Router />
          </HashRouter>

          <ReactQueryDevtools />
        </ChakraProvider>
      </Web3OnboardProvider>
    </QueryClientProvider>
  );
};
