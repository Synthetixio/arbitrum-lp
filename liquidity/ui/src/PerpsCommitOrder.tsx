import { Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Text } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { useImportExtras, useImportSystemToken, usePerpsMetadata } from '@synthetixio/react-sdk';
import { ethers } from 'ethers';
import React from 'react';
import { PerpsOpenPosition } from './PerpsOpenPosition';
import { PerpsOrder } from './PerpsOrder';
import { PerpsRequiredMargins } from './PerpsRequiredMargins';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { usePerpsCommitOrder } from './usePerpsCommitOrder';
import { usePerpsGetAvailableMargin } from './usePerpsGetAvailableMargin';
import { useProvider } from './useProvider';

export function PerpsCommitOrder() {
  const { data: systemToken } = useImportSystemToken();
  const [params] = useParams();

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, 18);
  const provider = useProvider();
  const market = usePerpsMetadata({ provider, perpsMarketId: params.market ? ethers.BigNumber.from(params.market) : undefined });
  const availableMargin = usePerpsGetAvailableMargin();
  const { data: extras } = useImportExtras();
  const commitOrder = usePerpsCommitOrder({
    onSuccess: () => setValue(''),
    settlementStrategyId: extras?.eth_pyth_settlement_strategy,
  });

  const token = market?.data && { symbol: market.data.symbol, decimals: 18 };

  return (
    <Box mt="6%">
      <PerpsOpenPosition />
      <PerpsRequiredMargins />
      <Box
        borderWidth="1px"
        rounded="lg"
        maxWidth={800}
        p={6}
        m="5% auto"
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          commitOrder.mutate(parsedAmount);
        }}
      >
        <FormControl isInvalid={commitOrder.isError}>
          <FormLabel fontSize="3xl">Commit Order</FormLabel>
          <Text mb="2">
            Available Margin:{' '}
            <b>{renderAmount(availableMargin.data, systemToken && { symbol: systemToken.symbol, decimals: systemToken.decimals })}</b>
          </Text>
          <Input required placeholder="Enter amount" value={value} onChange={(e) => setValue(e.target.value)} />
          {commitOrder.isError ? (
            <FormErrorMessage>{commitOrder.error?.message}</FormErrorMessage>
          ) : (
            <FormHelperText>
              Max:{' '}
              <b>
                {availableMargin
                  ? renderAmount(availableMargin.data, systemToken && { symbol: systemToken.symbol, decimals: systemToken.decimals })
                  : null}
              </b>
            </FormHelperText>
          )}
        </FormControl>
        <Button type="submit" mt="5%" isLoading={commitOrder.isPending}>
          Commit Order
          {parsedAmount.gt(0) ? ` ${renderAmount(parsedAmount, token)}` : null}
        </Button>
      </Box>
      <PerpsOrder />
    </Box>
  );
}
