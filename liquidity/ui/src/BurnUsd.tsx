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
import { useAccountAvailableCollateral, useBurnUsd, useImportSystemToken, usePositionDebt } from '@synthetixio/react-sdk';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useProvider } from './useProvider';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function BurnUsd() {
  const provider = useProvider();

  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const accountId = useSelectedAccountId();

  const { data: positionDebt } = usePositionDebt({
    provider,
    accountId,
    poolId,
    collateralTypeTokenAddress: collateralType?.address,
  });

  const { data: systemToken } = useImportSystemToken();

  const { data: accountAvailableUsd } = useAccountAvailableCollateral({
    provider,
    accountId,
    collateralTypeTokenAddress: systemToken?.address,
  });

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, collateralType?.decimals);

  const burnUsd = useBurnUsd({
    provider,
    accountId,
    collateralTypeTokenAddress: collateralType?.address,
    poolId,
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
        Burn {systemToken ? systemToken.symbol : null}
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
            isDisabled={!(parsedAmount.gt(0) && accountAvailableUsd && accountAvailableUsd.gte(parsedAmount))}
          >
            Burn {systemToken ? systemToken.symbol : null}
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
