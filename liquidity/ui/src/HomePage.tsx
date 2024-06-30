import { Flex } from '@chakra-ui/react';
import React from 'react';
import { Helmet } from 'react-helmet';
import { CollateralTokens } from './CollateralTokens';
import { Delegate } from './Delegate';
import { Deposit } from './Deposit';
import { Undelegate } from './Undelegate';
import { Withdraw } from './Withdraw';

export function HomePage() {
  return (
    <Flex flexDir="column" mb={20} gap={10}>
      <Helmet>
        <title>Synthetix Liquidity V3</title>
        <meta name="description" content="Synthetix V3 - Dashboard" />
      </Helmet>
      <CollateralTokens />
      <Deposit />
      <Flex flexDir="row" gap={10}>
        <Delegate />
        <Undelegate />
      </Flex>
      <Withdraw />
    </Flex>
  );
}
