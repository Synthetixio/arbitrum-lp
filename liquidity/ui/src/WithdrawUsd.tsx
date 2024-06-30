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
import { useConnectWallet } from '@web3-onboard/react';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useAccountAvailableCollateral } from './useAccountAvailableCollateral';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSystemToken } from './useSystemToken';
import { useTokenBalance } from './useTokenBalance';
import { useWithdraw } from './useWithdraw';
import { useWithdrawTimer } from './useWithdrawTimer';

export function WithdrawUsd() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const { data: systemToken } = useSystemToken();

  const { data: accountAvailableCollateral } = useAccountAvailableCollateral({
    accountId,
    tokenAddress: systemToken?.address,
  });

  const { data: currentBalance } = useTokenBalance({
    ownerAddress: walletAddress,
    tokenAddress: systemToken?.address,
  });

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, systemToken?.decimals);

  const withdraw = useWithdraw({
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
          &nbsp;
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
                currentBalance &&
                currentBalance.sub(parsedAmount).gte(0) &&
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
            {withdrawTimer.h === 0 && withdrawTimer.m === 0 && withdrawTimer.s > 0
              ? ` in ${withdrawTimer.s}s`
              : null}
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
