import { Alert, AlertIcon, Box, Button, Spinner, Text } from '@chakra-ui/react';
import React from 'react';
import { usePerpsSettleOrder } from './usePerpsSettleOrder';

export function PerpsSettleOrder() {
  const settleOrder = usePerpsSettleOrder();

  if (settleOrder.isPending) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text>Settling the order...</Text>
      </Box>
    );
  }

  if (settleOrder.isPending) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to settle the order.
      </Alert>
    );
  }

  return (
    <Button type="button" mt="5%" onClick={() => settleOrder.mutate()}>
      Settle Order
    </Button>
  );
}
