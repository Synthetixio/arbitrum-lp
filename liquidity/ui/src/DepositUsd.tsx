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
import {
  useAccountAvailableCollateral,
  useDeposit,
  useImportContract,
  useImportSystemToken,
  useTokenAllowance,
  useTokenBalance,
} from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useProvider } from './useProvider';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function DepositUsd() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = useProvider();
  const accountId = useSelectedAccountId();
  const { data: systemToken } = useImportSystemToken();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  const { data: currentBalance } = useTokenBalance({
    provider,
    ownerAddress: walletAddress,
    tokenAddress: systemToken?.address,
  });

  const { data: currentAllowance } = useTokenAllowance({
    provider,
    ownerAddress: walletAddress,
    tokenAddress: systemToken?.address,
    spenderAddress: CoreProxyContract?.address,
  });

  const { data: accountAvailableCollateral } = useAccountAvailableCollateral({
    provider,
    accountId,
    collateralTypeTokenAddress: systemToken?.address,
  });

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, systemToken?.decimals);
  const poolId = useSelectedPoolId();
  const collateralType = useSelectedCollateralType();
  const deposit = useDeposit({
    provider,
    walletAddress,
    accountId,
    poolId,
    collateralTypeTokenAddress: collateralType?.address,
    onSuccess: () => setValue(''),
  });

  return (
    <Stack
      gap={3}
      as="form"
      method="POST"
      action="#"
      onSubmit={(e) => {
        e.preventDefault();
        deposit.mutate(parsedAmount);
      }}
    >
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Deposit {systemToken ? systemToken.symbol : null}
        <Text as="span" ml={4} fontSize="1rem" fontWeight="normal">
          Deposited: <b>{renderAmount(accountAvailableCollateral, systemToken)}</b>
        </Text>
      </Heading>
      {deposit.isError ? (
        <Alert status="error" maxWidth="40rem">
          <AlertIcon />
          <AlertTitle>{deposit.error.message}</AlertTitle>
        </Alert>
      ) : null}
      <FormControl>
        <InputGroup gap={3}>
          <Input
            required
            placeholder="Enter amount"
            value={value}
            onChange={(e) => {
              deposit.reset();
              setValue(e.target.value);
            }}
            maxWidth="10rem"
          />
          <Button
            type="submit"
            isLoading={deposit.isPending}
            isDisabled={!(parsedAmount.gt(0) && currentBalance && currentBalance.sub(parsedAmount).gte(0))}
          >
            {currentAllowance?.gte(parsedAmount) ? 'Deposit' : 'Approve and Deposit'}
            {parsedAmount.gt(0) ? ` ${renderAmount(parsedAmount, systemToken)}` : null}
          </Button>
        </InputGroup>
        <FormHelperText>
          Max: <b>{renderAmount(currentBalance, systemToken)}</b>
        </FormHelperText>
      </FormControl>
    </Stack>
  );
}
