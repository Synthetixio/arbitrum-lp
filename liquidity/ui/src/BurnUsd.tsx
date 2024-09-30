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
import { useImportSystemToken, useSelectedAccountId, useSelectedCollateralType, useSelectedPoolId } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import React from 'react';
import { parseAmount } from './parseAmount';
import { renderAmount } from './renderAmount';
import { useAccountAvailableCollateral } from './useAccountAvailableCollateral';
import { useBurnUsd } from './useBurnUsd';
import { usePositionDebt } from './usePositionDebt';
import { useProvider } from './useProvider';

export function BurnUsd() {
  const [params] = useParams();
  const provider = useProvider();

  const collateralType = useSelectedCollateralType({ collateralType: params.collateralType });
  const poolId = useSelectedPoolId({ poolId: params.poolId });
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const accountId = useSelectedAccountId({
    accountId: params.accountId,
    provider,
    walletAddress,
  });

  const { data: positionDebt } = usePositionDebt({
    accountId,
    poolId,
    tokenAddress: collateralType?.address,
  });

  const { data: systemToken } = useImportSystemToken();

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
