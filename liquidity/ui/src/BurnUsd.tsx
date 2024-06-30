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
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useAccountAvailableCollateral } from './useAccountAvailableCollateral';
import { useBurnUsd } from './useBurnUsd';
import { usePositionDebt } from './usePositionDebt';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';
import { useSystemToken } from './useSystemToken';

export function BurnUsd() {
  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: positionDebt } = usePositionDebt({
    accountId,
    poolId,
    tokenAddress: collateralType?.address,
  });

  const { data: systemToken } = useSystemToken();

  const { data: accountAvailableUsd } = useAccountAvailableCollateral({
    accountId,
    tokenAddress: systemToken?.address,
  });

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, collateralType?.decimals);

  const burnUsd = useBurnUsd({
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
        burnUsd.mutate(parsedAmount);
      }}
    >
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Repay
        <Text as="span" ml={4} fontSize="1rem" fontWeight="normal">
          Available: <b>{renderAmount(accountAvailableUsd, systemToken)}</b>
        </Text>
      </Heading>
      {burnUsd.isError ? (
        <Alert status="error" maxWidth="40rem">
          <AlertIcon />
          <AlertTitle>{burnUsd.error.message}</AlertTitle>
        </Alert>
      ) : null}

      <FormControl>
        <InputGroup gap={3}>
          <Input
            required
            placeholder="Enter amount"
            value={value}
            onChange={(e) => {
              burnUsd.reset();
              setValue(e.target.value);
            }}
            maxWidth="10rem"
          />
          <Button
            type="submit"
            isLoading={burnUsd.isPending}
            isDisabled={
              !(parsedAmount.gt(0) && accountAvailableUsd && accountAvailableUsd.gte(parsedAmount))
            }
          >
            Repay
            {parsedAmount.gt(0) ? ` ${renderAmount(parsedAmount, systemToken)}` : null}
          </Button>
        </InputGroup>
        <FormHelperText>
          Max: <b>{renderAmount(positionDebt, systemToken)}</b>
        </FormHelperText>
      </FormControl>
    </Stack>
  );
}
