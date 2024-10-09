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
import { useAccountAvailableCollateral, useDelegateCollateral, usePositionCollateral } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useProvider } from './useProvider';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function Delegate() {
  const provider = useProvider();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const accountId = useSelectedAccountId();

  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: accountAvailableCollateral } = useAccountAvailableCollateral({
    provider,
    accountId,
    collateralTypeTokenAddress: collateralType?.address,
  });

  const { data: positionCollateral } = usePositionCollateral({
    provider,
    accountId,
    poolId,
    collateralTypeTokenAddress: collateralType?.address,
  });

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, collateralType?.decimals);

  const delegate = useDelegateCollateral({
    provider,
    walletAddress,
    collateralTypeTokenAddress: collateralType?.address,
    poolId,
    accountId,
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
        delegate.mutate(parsedAmount);
      }}
    >
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Delegate
        <Text as="span" ml={4} fontSize="1rem" fontWeight="normal">
          Delegated: <b>{renderAmount(positionCollateral, collateralType)}</b>
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
          <Button
            type="submit"
            isLoading={delegate.isPending}
            isDisabled={
              !(
                parsedAmount.gt(0) &&
                accountAvailableCollateral &&
                accountAvailableCollateral.gte(parsedAmount) &&
                positionCollateral &&
                positionCollateral.add(parsedAmount).gte(0)
              )
            }
          >
            Delegate
            {parsedAmount.gt(0) ? ` ${renderAmount(parsedAmount, collateralType)}` : null}
          </Button>
        </InputGroup>
        <FormHelperText>
          Max: <b>{renderAmount(accountAvailableCollateral, collateralType)}</b>
        </FormHelperText>
      </FormControl>
    </Stack>
  );
}
