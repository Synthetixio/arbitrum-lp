import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  FormControl,
  FormHelperText,
  Heading,
  Input,
  InputGroup,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useAccountAvailableCollateral, useImportSystemToken, useTokenBalance, useWithdraw } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useProvider } from './useProvider';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useWithdrawTimer } from './useWithdrawTimer';

export function WithdrawUsd() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = useProvider();
  const accountId = useSelectedAccountId();
  const { data: systemToken } = useImportSystemToken();

  const { data: accountAvailableCollateral } = useAccountAvailableCollateral({
    provider,
    accountId,
    collateralTypeTokenAddress: systemToken?.address,
  });

  const { data: currentBalance } = useTokenBalance({
    provider,
    ownerAddress: walletAddress,
    tokenAddress: systemToken?.address,
  });

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, systemToken?.decimals);

  const withdraw = useWithdraw({
    provider,
    walletAddress,
    accountId,
    collateralTypeTokenAddress: systemToken?.address,
    onSuccess: () => setValue(''),
  });

  const withdrawTimer = useWithdrawTimer();

  return (
    <Stack
      gap={3}
      as="form"
      method="POST"
      action="#"
      onSubmit={(e) => {
        e.preventDefault();
        withdraw.mutate(parsedAmount);
      }}
    >
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Withdraw {systemToken ? systemToken.symbol : null}
        <Text as="span" ml={4} fontSize="1rem" fontWeight="normal">
          Balance: <b>{renderAmount(currentBalance, systemToken)}</b>
        </Text>
      </Heading>
      {withdraw.isError ? (
        <Alert status="error" maxWidth="40rem">
          <AlertIcon />
          <AlertTitle>{withdraw.error.message}</AlertTitle>
        </Alert>
      ) : null}
      <FormControl>
        <InputGroup gap={3}>
          <Input
            required
            placeholder="Enter amount"
            value={value}
            onChange={(e) => {
              withdraw.reset();
              setValue(e.target.value);
            }}
            maxWidth="10rem"
          />
          <Button
            type="submit"
            isLoading={withdraw.isPending}
            isDisabled={
              !(
                parsedAmount.gt(0) &&
                accountAvailableCollateral &&
                accountAvailableCollateral.sub(parsedAmount).gte(0) &&
                withdrawTimer.h === 0 &&
                withdrawTimer.m === 0 &&
                withdrawTimer.s === 0
              )
            }
          >
            Withdraw
            {withdrawTimer.h === 0 && withdrawTimer.m === 0 && withdrawTimer.s === 0
              ? parsedAmount.gt(0)
                ? ` ${renderAmount(parsedAmount, systemToken)}`
                : null
              : null}
            {withdrawTimer.h === 0 && withdrawTimer.m === 0 && withdrawTimer.s > 0 ? ` in ${withdrawTimer.s}s` : null}
            {withdrawTimer.h === 0 && withdrawTimer.m > 0 ? ` in ${withdrawTimer.m}m` : null}
            {withdrawTimer.h > 0 ? ` in ${withdrawTimer.h}h` : null}
          </Button>
        </InputGroup>
        <FormHelperText>
          Max: <b>{renderAmount(accountAvailableCollateral, systemToken)}</b>
        </FormHelperText>
      </FormControl>
    </Stack>
  );
}
