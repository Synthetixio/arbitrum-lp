import { Button, Heading, Stack } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { useCollateralTokens, useSelectedCollateralType } from '@synthetixio/react-sdk';
import React from 'react';

export function CollateralTokens() {
  const [params, setParams] = useParams();
  const collateralTokens = useCollateralTokens();
  const selectedCollateralType = useSelectedCollateralType({ collateralType: params.collateralType });

  return (
    <Stack gap={3}>
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Vaults
      </Heading>
      <Stack flexDirection="row" gap={3}>
        {collateralTokens.map((token: { address: string; symbol: string }) => (
          <Button
            key={token.address}
            type="button"
            variant={selectedCollateralType?.address === token.address ? undefined : 'outline'}
            onClick={() => setParams({ ...params, collateralType: token.address })}
          >
            {token.symbol}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
