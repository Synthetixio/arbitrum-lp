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
import { useDelegateCollateral, usePositionCollateral } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useProvider } from './useProvider';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function Undelegate() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();
  const provider = useProvider();
  const accountId = useSelectedAccountId();
  const { data: positionCollateral } = usePositionCollateral({
    provider,
    accountId,
    poolId,
    collateralTypeTokenAddress: collateralType?.address,
  });
  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, collateralType?.decimals);

  const undelegate = useDelegateCollateral({
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
        undelegate.mutate(parsedAmount.mul(-1));
      }}
    >
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Undelegate
        <Text as="span" ml={4} fontSize="1rem" fontWeight="normal">
          &nbsp;
        </Text>
      </Heading>
      {undelegate.isError ? (
        <Alert status="error" maxWidth="40rem">
          <AlertIcon />
          <AlertTitle>{undelegate.error.message}</AlertTitle>
        </Alert>
      ) : null}

      <FormControl>
        <InputGroup gap={3}>
          <Input
            required
            placeholder="Enter amount"
            value={value}
            onChange={(e) => {
              undelegate.reset();
              setValue(e.target.value);
            }}
            maxWidth="10rem"
          />
          <Button
            type="submit"
            isLoading={undelegate.isPending}
            isDisabled={!(parsedAmount.gt(0) && positionCollateral && positionCollateral.sub(parsedAmount).gte(0))}
          >
            Undelegate
            {parsedAmount.gt(0) ? ` ${renderAmount(parsedAmount, collateralType)}` : null}
          </Button>
        </InputGroup>
        <FormHelperText>
          Max: <b>{renderAmount(positionCollateral, collateralType)}</b>
        </FormHelperText>
      </FormControl>
    </Stack>
  );
}
