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
import { useCollateralPrice, useImportSystemToken, useMintUsd, usePositionCollateral, usePositionDebt } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useProvider } from './useProvider';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useSelectedPoolId } from './useSelectedPoolId';

export function MintUsd() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const provider = useProvider();
  const accountId = useSelectedAccountId();
  const poolId = useSelectedPoolId();
  const collateralType = useSelectedCollateralType();

  const { data: positionCollateral } = usePositionCollateral({
    provider,
    accountId,
    poolId,
    tokenAddress: collateralType?.address,
  });

  const { data: collateralPrice } = useCollateralPrice({
    provider,
    tokenAddress: collateralType?.address,
  });

  const { data: positionDebt } = usePositionDebt({
    provider,
    accountId,
    poolId,
    tokenAddress: collateralType?.address,
  });
  const readableDebt = positionDebt?.abs().gte(ethers.utils.parseUnits('0.1', 18)) ? positionDebt : ethers.BigNumber.from(0);

  const maxDebt = React.useMemo(() => {
    if (positionCollateral && collateralPrice && collateralType && positionDebt) {
      return positionCollateral.mul(collateralPrice).div(collateralType.issuanceRatioD18).sub(positionDebt);
    }
  }, [positionCollateral, collateralPrice, collateralType, positionDebt]);

  const { data: systemToken } = useImportSystemToken();

  const [value, setValue] = React.useState('');
  const parsedAmount = parseAmount(value, collateralType?.decimals);
  const mintUsd = useMintUsd({
    provider,
    walletAddress,
    accountId,
    collateralTokenAddress: collateralType?.address,
    poolId,
    onSuccess: () => {
      setValue('');
    },
  });

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
        Mint {systemToken ? systemToken.symbol : null}
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
          <Button type="submit" isLoading={mintUsd.isPending} isDisabled={!(parsedAmount.gt(0) && maxDebt && maxDebt.gte(parsedAmount))}>
            Mint {systemToken ? systemToken.symbol : null}
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
