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
import { useParams } from '@snx-v3/useParams';
import { useSelectedCollateralType } from '@synthetixio/react-sdk';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useDelegateCollateral } from './useDelegateCollateral';
import { usePositionCollateral } from './usePositionCollateral';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedPoolId } from './useSelectedPoolId';

export function Undelegate() {
  const accountId = useSelectedAccountId();

  const [params] = useParams();

  const collateralType = useSelectedCollateralType({ collateralType: params.collateralType });
  const poolId = useSelectedPoolId();

  const { data: positionCollateral } = usePositionCollateral({
    accountId,
    poolId,
    tokenAddress: collateralType?.address,
  });

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, collateralType?.decimals);

  const undelegate = useDelegateCollateral({
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
