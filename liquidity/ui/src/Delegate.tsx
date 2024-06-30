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
import { ethers } from 'ethers';
import React from 'react';
import { useAccountAvailableCollateral } from './useAccountAvailableCollateral';
import { useDelegateCollateral } from './useDelegateCollateral';
import { usePositionCollateral } from './usePositionCollateral';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function Delegate() {
  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: accountAvailableCollateral } = useAccountAvailableCollateral({
    accountId,
    tokenAddress: collateralType?.address,
  });

  const { data: positionCollateral } = usePositionCollateral({
    accountId,
    poolId,
    tokenAddress: collateralType?.address,
  });

  const [value, setValue] = React.useState('');

  const hasEnoughDeposit = React.useMemo(() => {
    if (!(collateralType?.decimals && accountAvailableCollateral)) {
      return true;
    }
    const filteredNumber = `${value}`.replace(/[^0-9.]+/gi, '');
    if (!filteredNumber) {
      return true;
    }
    return accountAvailableCollateral.gte(
      ethers.utils.parseUnits(filteredNumber, collateralType.decimals)
    );
  }, [value, collateralType?.decimals, accountAvailableCollateral]);

  const delegate = useDelegateCollateral();

  return (
    <Stack
      gap={3}
      as="form"
      method="POST"
      action="#"
      onSubmit={(e) => {
        e.preventDefault();
        if (!collateralType) {
          return;
        }
        const filteredInput = `${value}`.replace(/[^0-9.]+/gi, '');
        const delegateAmountDelta = filteredInput
          ? ethers.utils.parseUnits(filteredInput.trim(), collateralType.decimals)
          : ethers.BigNumber.from(0);
        delegate.mutate(delegateAmountDelta);
      }}
    >
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Lock
        <Text as="span" ml={4} fontSize="1rem" fontWeight="normal">
          Locked:{' '}
          <b>
            {positionCollateral && collateralType
              ? parseFloat(
                  ethers.utils.formatUnits(positionCollateral, collateralType.decimals)
                ).toFixed(1)
              : ''}
          </b>
        </Text>
      </Heading>
      {delegate.isError ? (
        <Alert status="error" maxWidth="40rem">
          <AlertIcon />
          <AlertTitle>{delegate.error.message}</AlertTitle>
        </Alert>
      ) : null}

      <FormControl>
        <InputGroup gap={3}>
          <Input
            required
            placeholder="Enter amount"
            value={value}
            onChange={(e) => {
              delegate.reset();
              setValue(e.target.value);
            }}
            maxWidth="10rem"
          />
          <Button type="submit" isLoading={delegate.isPending} disabled={!hasEnoughDeposit}>
            {hasEnoughDeposit ? 'Lock' : 'Deposit and Lock'}
          </Button>
        </InputGroup>
        <FormHelperText>
          Max:{' '}
          <b>
            {accountAvailableCollateral && collateralType
              ? parseFloat(
                  ethers.utils.formatUnits(accountAvailableCollateral, collateralType.decimals)
                ).toFixed(1)
              : ''}
          </b>
        </FormHelperText>
      </FormControl>
    </Stack>
  );
}
