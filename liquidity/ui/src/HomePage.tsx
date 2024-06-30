import { Flex } from '@chakra-ui/react';
import React from 'react';
import { Helmet } from 'react-helmet';
import { CollateralTokens } from './CollateralTokens';
import { Delegate } from './Delegate';
import { Deposit } from './Deposit';
import { Undelegate } from './Undelegate';

export function HomePage() {
  return (
    <Flex flexDir="column" mb={20}>
      <Helmet>
        <title>Synthetix Liquidity V3</title>
        <meta name="description" content="Synthetix V3 - Dashboard" />
      </Helmet>
      <Flex flexDir="column" mt={10}>
        <CollateralTokens />
      </Flex>
      <Flex flexDir="column" mt={10}>
        <Deposit />
      </Flex>
      <Flex flexDir="column" mt={10}>
        <Delegate />
      </Flex>
      <Flex flexDir="column" mt={10}>
        <Undelegate />
      </Flex>
    </Flex>
  );
}
