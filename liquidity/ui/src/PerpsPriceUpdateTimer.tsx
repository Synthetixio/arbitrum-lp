import { Box, Button, Spinner, Text, VStack } from '@chakra-ui/react';
import type React from 'react';
import { usePerpsDoStrictPriceUpdate } from './usePerpsDoStrictPriceUpdate';
import { usePriceUpdateTimer } from './usePriceUpdateTimer';

export function PerpsPriceUpdateTimer({
  commitmentTime,
}: {
  commitmentTime: number;
}) {
  const { refetch, isFetching } = usePerpsDoStrictPriceUpdate({ commitmentTime });
  const { h, m, s, timerExpired } = usePriceUpdateTimer({ commitmentTime });

  return (
    <Box textAlign="center" fontSize="xl" mt="6">
      <VStack spacing={4} align="center">
        <Text fontSize="xl" fontWeight="bold">
          {timerExpired ? 'Time is up. Commit order again.' : 'Manual price updates are available within:'}
        </Text>
        <Box>
          <Text fontSize="2xl">{`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`}</Text>
        </Box>
        {!timerExpired && !isFetching ? (
          <Button type="button" onClick={() => refetch()}>
            Re fetch price
          </Button>
        ) : null}
        {isFetching ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
          </Box>
        ) : null}
      </VStack>
    </Box>
  );
}
