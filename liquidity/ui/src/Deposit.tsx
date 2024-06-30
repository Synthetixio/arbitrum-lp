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
import { ethers } from 'ethers';
import React from 'react';
import { useAccountAvailableCollateral } from './useAccountAvailableCollateral';
import { useCoreProxy } from './useCoreProxy';
import { useDeposit } from './useDeposit';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useTokenAllowance } from './useTokenAllowance';
import { useTokenBalance } from './useTokenBalance';

export function Deposit() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();

  const { data: CoreProxyContract } = useCoreProxy();

  const { data: currentBalance } = useTokenBalance({
    ownerAddress: walletAddress,
    tokenAddress: collateralType?.address,
  });

  const { data: currentAllowance } = useTokenAllowance({
    ownerAddress: walletAddress,
    tokenAddress: collateralType?.address,
    spenderAddress: CoreProxyContract?.address,
  });

  const { data: accountAvailableCollateral } = useAccountAvailableCollateral({
    accountId,
    tokenAddress: collateralType?.address,
  });

  const deposit = useDeposit();

  const [value, setValue] = React.useState('');

  const hasEnoughAllowance = React.useMemo(() => {
    if (!(collateralType?.decimals && currentAllowance)) {
      return true;
    }
    const filteredNumber = `${value}`.replace(/[^0-9.]+/gi, '');
    if (!filteredNumber) {
      return true;
    }
    return currentAllowance.gte(ethers.utils.parseUnits(filteredNumber, collateralType.decimals));
  }, [value, collateralType?.decimals, currentAllowance]);

  return (
    <Stack
      gap={3}
      as="form"
      method="POST"
      action="#"
      onSubmit={(e) => {
        e.preventDefault();
        deposit.mutate(value);
      }}
    >
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Deposit
        <Text as="span" ml={4} fontSize="1rem" fontWeight="normal">
          Deposited:{' '}
          <b>
            {accountAvailableCollateral && collateralType
              ? parseFloat(
                  ethers.utils.formatUnits(accountAvailableCollateral, collateralType.decimals)
                ).toFixed(1)
              : ''}
          </b>
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
          <Button type="submit" isLoading={deposit.isPending}>
            {hasEnoughAllowance ? 'Deposit' : 'Approve and Deposit'}
          </Button>
        </InputGroup>
        <FormHelperText>
          Max:{' '}
          <b>
            {currentBalance && collateralType
              ? parseFloat(
                  ethers.utils.formatUnits(currentBalance, collateralType.decimals)
                ).toFixed(1)
              : ''}
          </b>
        </FormHelperText>
      </FormControl>
    </Stack>
  );
}
