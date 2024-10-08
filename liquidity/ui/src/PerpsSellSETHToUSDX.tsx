import { Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Text } from '@chakra-ui/react';
import { useImportExtras, useImportSystemToken, useSpotSell, useTokenBalance } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useProvider } from './useProvider';

export function PerpsSellSETHToUSDX() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const { data: extras } = useImportExtras();
  const provider = useProvider();

  const sell = useSpotSell({
    provider,
    walletAddress,
    synthMarketId: extras?.synth_eth_market_id,
    settlementStrategyId: extras?.eth_pyth_settlement_strategy,
    synthTokenAddress: extras?.synth_eth_token_address,
    onSuccess: () => setValue(''),
  });

  const { data: systemToken } = useImportSystemToken();
  const { data: currentUSDXBalance } = useTokenBalance({
    provider,
    ownerAddress: walletAddress,
    tokenAddress: systemToken?.address,
  });

  const { data: currentSynthBalance } = useTokenBalance({
    provider,
    ownerAddress: walletAddress,
    tokenAddress: extras?.synth_eth_token_address,
  });

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, 18);

  return (
    <Box mt="6%">
      <Box
        borderWidth="1px"
        rounded="lg"
        maxWidth={800}
        p={6}
        m="5% auto"
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          sell.mutate(parsedAmount);
        }}
      >
        <FormControl isInvalid={sell.isError}>
          <FormLabel fontSize="3xl">Sell sETH for USDx</FormLabel>
          <Text mb="2">
            Current Synth (sETH) Balance: <b>{renderAmount(currentSynthBalance, { symbol: 'sETH', decimals: 18 })}</b>
          </Text>
          <Text mb="2">
            Current (USDx) Balance:{' '}
            <b>{renderAmount(currentUSDXBalance, systemToken && { symbol: systemToken.symbol, decimals: systemToken.decimals })}</b>
          </Text>
          <Input required placeholder="Enter amount" value={value} onChange={(e) => setValue(e.target.value)} />
          {sell.isError ? (
            <FormErrorMessage>{sell.error?.message}</FormErrorMessage>
          ) : (
            <FormHelperText>
              Max: <b>{renderAmount(currentSynthBalance, { symbol: 'sETH', decimals: 18 })}</b>
            </FormHelperText>
          )}
        </FormControl>
        <Button type="submit" mt="5%" isLoading={sell.isPending}>
          Sell
          {parsedAmount.gt(0) ? ` ${renderAmount(parsedAmount, { symbol: 'sETH', decimals: 18 })}` : null}
        </Button>
      </Box>
    </Box>
  );
}
