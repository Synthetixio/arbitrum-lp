import { Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Text } from '@chakra-ui/react';
import {
  useImportContract,
  useImportSystemToken,
  usePerpsGetCollateralAmount,
  usePerpsModifyCollateral,
  useTokenAllowance,
  useTokenBalance,
} from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';
import { useProvider } from './useProvider';

export function PerpsDepositMargin() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = useProvider();
  const perpsAccountId = usePerpsSelectedAccountId();
  const { data: collateralAmount } = usePerpsGetCollateralAmount({
    provider,
    perpsAccountId,
  });
  const modifyCollateral = usePerpsModifyCollateral({
    provider,
    walletAddress,
    perpsAccountId,
  });
  const { data: systemToken } = useImportSystemToken();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, 18);
  const { data: currentBalance } = useTokenBalance({
    provider,
    ownerAddress: walletAddress,
    tokenAddress: systemToken?.address,
  });
  const { data: currentAllowance } = useTokenAllowance({
    provider,
    ownerAddress: walletAddress,
    tokenAddress: systemToken?.address,
    spenderAddress: PerpsMarketProxyContract?.address,
  });

  return (
    <Box mt="10%">
      <Box
        borderWidth="1px"
        rounded="lg"
        maxWidth={800}
        p={6}
        m="5% auto"
        as="form"
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          modifyCollateral.mutate(parsedAmount);
        }}
      >
        <FormControl isInvalid={modifyCollateral.isError}>
          <FormLabel fontSize="3xl">Deposit margin</FormLabel>
          <Text ml={4} mb={2} fontSize="1rem" fontWeight="normal">
            Deposited margin:{' '}
            {systemToken ? renderAmount(collateralAmount, { symbol: systemToken.symbol, decimals: systemToken.decimals }) : null}
          </Text>
          <Input required placeholder="Enter amount" value={value} onChange={(e) => setValue(e.target.value)} />
          {modifyCollateral.isError ? (
            <FormErrorMessage>{modifyCollateral.error?.message}</FormErrorMessage>
          ) : (
            <FormHelperText>
              Max:{' '}
              <b>{systemToken ? renderAmount(currentBalance, { symbol: systemToken.symbol, decimals: systemToken.decimals }) : null}</b>
            </FormHelperText>
          )}
        </FormControl>
        <Button
          type="submit"
          mt="5%"
          isLoading={modifyCollateral.isPending}
          isDisabled={!(parsedAmount.gt(0) && currentBalance && currentBalance.sub(parsedAmount).gte(0))}
        >
          {currentAllowance?.gte(parsedAmount) ? 'Deposit' : 'Approve and Deposit'}
          {parsedAmount.gt(0)
            ? ` ${systemToken ? renderAmount(parsedAmount, { symbol: systemToken.symbol, decimals: systemToken.decimals }) : null}`
            : null}
        </Button>
      </Box>
    </Box>
  );
}
