import { Alert, AlertIcon, Box, Button, Spinner, Text } from '@chakra-ui/react';
import { useImportExtras } from '@synthetixio/react-sdk';
import type { ethers } from 'ethers';
import React from 'react';
import { usePerpsSettleOrder } from './usePerpsSettleOrder';
import { usePriceUpdateTimer } from './usePriceUpdateTimer';

export function PerpsSettleOrder({ commitmentTime }: { commitmentTime: ethers.BigNumber }) {
  const { data: extras } = useImportExtras();
  const settleOrder = usePerpsSettleOrder({ settlementStrategyId: extras?.eth_pyth_settlement_strategy });
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
