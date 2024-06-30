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
import { useCollateralPrice } from './useCollateralPrice';
import { useMintUsd } from './useMintUsd';
import { usePositionCollateral } from './usePositionCollateral';
import { usePositionDebt } from './usePositionDebt';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';
import { useSystemToken } from './useSystemToken';

export function MintUsd() {
  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: positionCollateral } = usePositionCollateral({
    accountId,
    poolId,
    tokenAddress: collateralType?.address,
  });

  const { data: collateralPrice } = useCollateralPrice({
    tokenAddress: collateralType?.address,
  });

  const { data: positionDebt } = usePositionDebt({
    accountId,
    poolId,
    tokenAddress: collateralType?.address,
  });
  const readableDebt =
    positionDebt && positionDebt.abs().gte(ethers.utils.parseUnits('0.1', 18))
      ? positionDebt
      : ethers.BigNumber.from(0);

  const maxDebt = React.useMemo(() => {
    if (positionCollateral && collateralPrice && collateralType && positionDebt) {
      return positionCollateral
        .mul(collateralPrice)
        .div(collateralType.issuanceRatioD18)
        .sub(positionDebt);
    }
  }, [positionCollateral, collateralPrice, collateralType, positionDebt]);

  const { data: systemToken } = useSystemToken();

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, collateralType?.decimals);

  const mintUsd = useMintUsd();

  return (
    <Stack
      gap={3}
      as="form"
      method="POST"
      action="#"
      onSubmit={(e) => {
        e.preventDefault();
        mintUsd.mutate(parsedAmount);
      }}
    >
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Borrow
        <Text as="span" ml={4} fontSize="1rem" fontWeight="normal">
          Debt: <b>{renderAmount(readableDebt, systemToken)}</b>
        </Text>
      </Heading>
      {mintUsd.isError ? (
        <Alert status="error" maxWidth="40rem">
          <AlertIcon />
          <AlertTitle>{mintUsd.error.message}</AlertTitle>
        </Alert>
      ) : null}

      <FormControl>
        <InputGroup gap={3}>
          <Input
            required
            placeholder="Enter amount"
            value={value}
            onChange={(e) => {
              mintUsd.reset();
              setValue(e.target.value);
            }}
            maxWidth="10rem"
          />
          <Button
            type="submit"
            isLoading={mintUsd.isPending}
            isDisabled={!(parsedAmount.gt(0) && maxDebt && maxDebt.gte(parsedAmount))}
          >
            Borrow
            {parsedAmount.gt(0) ? ` ${renderAmount(parsedAmount, systemToken)}` : null}
          </Button>
        </InputGroup>
        <FormHelperText>
          Max: <b>{renderAmount(maxDebt, systemToken)}</b>
        </FormHelperText>
      </FormControl>
    </Stack>
  );
}
