import { Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Text } from '@chakra-ui/react';
import { useImportContract, useImportExtras } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useCollateralTokens } from './useCollateralTokens';
import { usePerpsWrapWETHCollateral } from './usePerpsWrapWETHCollateral';
import { useTokenAllowance } from './useTokenAllowance';
import { useTokenBalance } from './useTokenBalance';

export function PerpsWrapWETHCollateral() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const { data: SpotMarketProxyContract } = useImportContract('SpotMarketProxy');
  const { data: extras } = useImportExtras();

  const collateralTokens = useCollateralTokens();
  const tokenWETH = extras && collateralTokens?.find((token) => token.address === extras.weth_address);

  const { data: currentBalance } = useTokenBalance({
    ownerAddress: walletAddress,
    tokenAddress: tokenWETH?.address,
  });

  const { data: currentAllowance } = useTokenAllowance({
    ownerAddress: walletAddress,
    tokenAddress: tokenWETH?.address,
    spenderAddress: SpotMarketProxyContract?.address,
  });

  const { data: currentSynthBalance } = useTokenBalance({
    ownerAddress: walletAddress,
    tokenAddress: extras?.synth_eth_token_address,
  });

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, 18);

  const perpsWrapCollateral = usePerpsWrapWETHCollateral({
    onSuccess: () => setValue(''),
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
          perpsWrapCollateral.mutate(parsedAmount);
        }}
      >
        <FormControl isInvalid={perpsWrapCollateral.isError}>
          <FormLabel fontSize="3xl">Wrap WETH into sETH (Synthetic ETH)</FormLabel>
          <Text mb="2">
            Current WETH Allowance:{' '}
            <b>{renderAmount(currentAllowance, tokenWETH && { symbol: tokenWETH.symbol, decimals: tokenWETH.decimals })}</b>
          </Text>
          <Text mb="2">
            Current WETH Balance:{' '}
            <b>{renderAmount(currentBalance, tokenWETH && { symbol: tokenWETH.symbol, decimals: tokenWETH.decimals })}</b>
          </Text>
          <Text mb="2">
            Current Synth (sETH) Balance: <b>{renderAmount(currentSynthBalance, { symbol: 'sETH', decimals: 18 })}</b>
          </Text>
          <Input required placeholder="Enter amount" value={value} onChange={(e) => setValue(e.target.value)} />
          {perpsWrapCollateral.isError ? (
            <FormErrorMessage>{perpsWrapCollateral.error?.message}</FormErrorMessage>
          ) : (
            <FormHelperText>
              Max: <b>{renderAmount(currentBalance, tokenWETH && { symbol: tokenWETH.symbol, decimals: tokenWETH.decimals })}</b>
            </FormHelperText>
          )}
        </FormControl>
        <Button type="submit" mt="5%" isLoading={perpsWrapCollateral.isPending}>
          {currentAllowance?.gte(parsedAmount) ? 'Wrap' : 'Approve and Wrap'}
          {parsedAmount.gt(0)
            ? ` ${renderAmount(parsedAmount, tokenWETH && { symbol: tokenWETH.symbol, decimals: tokenWETH.decimals })}`
            : null}
        </Button>
      </Box>
    </Box>
  );
}
