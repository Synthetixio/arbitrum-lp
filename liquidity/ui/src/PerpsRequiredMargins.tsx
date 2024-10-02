import { Alert, AlertIcon, Box, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { useImportSystemToken, usePerpsGetRequiredMargins } from '@synthetixio/react-sdk';
import React from 'react';
import { renderAmount } from './renderAmount';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';
import { useProvider } from './useProvider';

export function PerpsRequiredMargins() {
  const provider = useProvider();
  const perpsAccountId = usePerpsSelectedAccountId();
  const requiredMargins = usePerpsGetRequiredMargins({
    provider,
    perpsAccountId,
  });
  const { data: systemToken } = useImportSystemToken();

  if (requiredMargins.isPending) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text>Loading order details...</Text>
      </Box>
    );
  }

  if (requiredMargins.isError) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load open position.
      </Alert>
    );
  }

  return (
    <Box p={5} shadow="md" borderWidth="1px" mt="5%">
      <VStack align="start">
        <Heading size="md">Margin Information</Heading>
        <Text>
          Initial Required Margin:{' '}
          {renderAmount(
            requiredMargins.data.requiredInitialMargin,
            systemToken && { symbol: systemToken.symbol, decimals: systemToken.decimals }
          )}
        </Text>
        <Text>
          Maintenance Required Margin:{' '}
          {renderAmount(
            requiredMargins.data.requiredMaintenanceMargin,
            systemToken && { symbol: systemToken.symbol, decimals: systemToken.decimals }
          )}
        </Text>
        <Text>
          Max Liquidation Reward:{' '}
          {renderAmount(
            requiredMargins.data.maxLiquidationReward,
            systemToken && { symbol: systemToken.symbol, decimals: systemToken.decimals }
          )}
        </Text>
      </VStack>
    </Box>
  );
}
