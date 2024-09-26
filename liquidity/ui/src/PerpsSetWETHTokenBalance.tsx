import { Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Text } from '@chakra-ui/react';
import { useImportExtras, useSynthetix, useWethDeposit } from '@synthetixio/react-sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useConnectWallet } from '@web3-onboard/react';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useCollateralTokens } from './useCollateralTokens';
import { useEthBalance } from './useEthBalance';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';
import { useProvider } from './useProvider';
import { useTokenBalance } from './useTokenBalance';

export function PerpsSetWETHTokenBalance() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const { chainId } = useSynthetix();
  const provider = useProvider();
  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: extras } = useImportExtras();
  const collateralTokens = useCollateralTokens();
  const tokenWETH = extras && collateralTokens?.find((token) => token.address === extras.weth_address);

  const queryClient = useQueryClient();
  const currentEthBalance = useEthBalance();
  const { data: currentBalance } = useTokenBalance({
    ownerAddress: walletAddress,
    tokenAddress: tokenWETH?.address,
  });

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, 18);
  const wethDeposit = useWethDeposit({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [chainId, 'Balance', { tokenAddress: tokenWETH?.address, ownerAddress: walletAddress }],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'EthBalance', { ownerAddress: walletAddress }],
      });

      setValue('');
    },
    provider,
    walletAddress,
    perpsAccountId,
  });

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
          wethDeposit.mutate(parsedAmount);
        }}
      >
        <FormControl isInvalid={wethDeposit.isError}>
          <FormLabel fontSize="3xl">Convert ETH to WETH (Wrapped ETH)</FormLabel>
          <Text mb="2">
            Current WETH Balance:{' '}
            <b>{renderAmount(currentBalance, tokenWETH && { symbol: tokenWETH.symbol, decimals: tokenWETH.decimals })}</b>
          </Text>
          <Text mb="2">
            Current ETH Balance: <b>{renderAmount(currentEthBalance.data, { symbol: 'ETH', decimals: 18 })}</b>
          </Text>
          <Input required placeholder="Enter amount" value={value} onChange={(e) => setValue(e.target.value)} />
          {wethDeposit.isError ? (
            <FormErrorMessage>{wethDeposit.error?.message}</FormErrorMessage>
          ) : (
            <FormHelperText>
              Max: <b>{currentEthBalance ? renderAmount(currentEthBalance.data, { symbol: 'ETH', decimals: 18 }) : null}</b>
            </FormHelperText>
          )}
        </FormControl>
        <Button type="submit" mt="5%" isLoading={wethDeposit.isPending}>
          Convert ETH to WETH
        </Button>
      </Box>
    </Box>
  );
}
