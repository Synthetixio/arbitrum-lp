import { Alert, AlertIcon, Box, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { useImportSystemToken } from '@synthetixio/react-sdk';
import React from 'react';
import { renderAmount } from './renderAmount';
import { useMarketMetadata } from './useMarketMetadata';
import { usePerpsGetOpenPosition } from './usePerpsGetOpenPosition';

export function PerpsOpenPosition() {
  const [params] = useParams();
  const market = useMarketMetadata(Number(params.market));
  const openPosition = usePerpsGetOpenPosition();
  const { data: systemToken } = useImportSystemToken();

  if (openPosition.isPending) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text>Loading order details...</Text>
      </Box>
    );
  }

  if (openPosition.isError) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load open position.
      </Alert>
    );
  }

  return (
    <Box p={5} shadow="md" borderWidth="1px">
      <VStack align="start">
        <Heading size="md">Open Position</Heading>
        <Text>
          Accrued funding:{' '}
          {renderAmount(openPosition?.data?.accruedFunding, systemToken && { symbol: systemToken.symbol, decimals: systemToken.decimals })}
        </Text>
        <Text>
          Owed Interest: {renderAmount(openPosition?.data?.owedInterest, market?.data && { symbol: market.data.symbol, decimals: 18 })}
        </Text>
        <Text>
          Position size: {renderAmount(openPosition?.data?.positionSize, market?.data && { symbol: market.data.symbol, decimals: 18 })}
        </Text>
        <Text>
          Total Pnl:{' '}
          {renderAmount(openPosition?.data?.totalPnl, systemToken && { symbol: systemToken.symbol, decimals: systemToken.decimals })}
        </Text>
      </VStack>
    </Box>
  );
}
