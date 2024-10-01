import { Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Text } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import {
  useImportExtras,
  useImportSystemToken,
  usePerpsCommitOrder,
  usePerpsGetAvailableMargin,
  usePerpsGetSettlementStrategy,
  usePerpsMetadata,
} from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { PerpsOpenPosition } from './PerpsOpenPosition';
import { PerpsOrder } from './PerpsOrder';
import { PerpsRequiredMargins } from './PerpsRequiredMargins';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';
import { useProvider } from './useProvider';

export function PerpsCommitOrder() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const { data: systemToken } = useImportSystemToken();
  const { data: extras } = useImportExtras();

  const [params] = useParams();

  const [value, setValue] = React.useState('');

  const provider = useProvider();
  const market = usePerpsMetadata({
    provider,
    perpsMarketId: params.perpsMarketId ? ethers.BigNumber.from(params.perpsMarketId) : undefined,
  });

  const perpsAccountId = usePerpsSelectedAccountId({ provider, walletAddress });

  const availableMargin = usePerpsGetAvailableMargin({
    provider,
    perpsAccountId,
  });

  const { data: settlementStrategy } = usePerpsGetSettlementStrategy({
    provider,
    perpsMarketId: params.perpsMarketId,
    settlementStrategyId: extras?.eth_pyth_settlement_strategy,
  });

  const parsedAmount = parseAmount(value, 18);

  const commitOrder = usePerpsCommitOrder({
    perpsAccountId,
    perpsMarketId: params.perpsMarketId,
    provider,
    walletAddress,
    feedId: settlementStrategy?.feedId,
    settlementStrategyId: extras?.eth_pyth_settlement_strategy,
    onSuccess: () => {
      setValue('');
    },
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
