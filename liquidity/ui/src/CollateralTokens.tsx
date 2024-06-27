import { Button, Heading } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import React from 'react';
import { useCollateralTokens } from './useCollateralTokens';
import { useSelectedCollateralType } from './useSelectedCollateralType';

export function CollateralTokens() {
  const [params, setParams] = useParams();
  const { data: collateralTokens } = useCollateralTokens();
  const selectedCollateralType = useSelectedCollateralType();

  return (
    <>
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Vaults
      </Heading>
      <div>
        {collateralTokens &&
          collateralTokens.map((token: { address: string; symbol: string }) => (
            <Button
              key={token.address}
              type="button"
              variant={selectedCollateralType?.address === token.address ? undefined : 'outline'}
              mr={3}
              onClick={() => setParams({ ...params, collateralType: token.address })}
            >
              {token.symbol}
            </Button>
          ))}
      </div>
    </>
  );
}
