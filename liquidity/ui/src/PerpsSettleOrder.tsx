import { Alert, AlertIcon, Box, Button, Spinner, Text } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { useImportExtras, usePerpsSettleOrder } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import type { ethers } from 'ethers';
import React from 'react';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';
import { usePriceUpdateTimer } from './usePriceUpdateTimer';
import { useProvider } from './useProvider';

export function PerpsSettleOrder({ commitmentTime }: { commitmentTime: ethers.BigNumber }) {
  const [{ wallet }] = useConnectWallet();
  const [params] = useParams();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: extras } = useImportExtras();
  const provider = useProvider();
  const perpsAccountId = usePerpsSelectedAccountId();
  const settleOrder = usePerpsSettleOrder({
    provider,
    walletAddress,
    perpsMarketId: params.perpsMarketId,
    perpsAccountId,
    settlementStrategyId: extras?.eth_pyth_settlement_strategy,
  });
  const { h, m, s } = usePriceUpdateTimer({
    commitmentTime: settleOrder.isError ? undefined : commitmentTime,
    settlementStrategyId: extras?.eth_pyth_settlement_strategy,
  });

  if (settleOrder.isPending) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text>Settling the order...</Text>
      </Box>
    );
  }

  if (settleOrder.isError) {
    return (
      <Alert status="error">
        <AlertIcon />
        {settleOrder.error.message}
      </Alert>
    );
  }

  const timerExpired = h === 0 && m === 0 && s === 0;

  return (
    <Button
      type="button"
      mt="5%"
      onClick={() => settleOrder.mutate()}
      isDisabled={timerExpired}
      colorScheme={timerExpired ? 'red' : undefined}
    >
      {timerExpired ? 'Timer expired' : 'Settle Order'}{' '}
      {`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`}
    </Button>
  );
}
