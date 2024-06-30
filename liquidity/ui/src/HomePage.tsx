import { Flex } from '@chakra-ui/react';
import React from 'react';
import { Helmet } from 'react-helmet';
import { BurnUsd } from './BurnUsd';
import { CollateralTokens } from './CollateralTokens';
import { Delegate } from './Delegate';
import { Deposit } from './Deposit';
import { DepositUsd } from './DepositUsd';
import { MintUsd } from './MintUsd';
import { Undelegate } from './Undelegate';
import { WithdrawCollateral } from './WithdrawCollateral';
import { WithdrawUsd } from './WithdrawUsd';

export function HomePage() {
  return (
    <Flex flexDir="column" mb={20} gap={10}>
      <Helmet>
        <title>Synthetix Liquidity V3</title>
        <meta name="description" content="Synthetix V3 - Dashboard" />
      </Helmet>
      <CollateralTokens />
      <Deposit />
      <DepositUsd />
      <Flex flexDir="row" gap={10}>
        <Delegate />
        <Undelegate />
      </Flex>
      <Flex flexDir="row" gap={10}>
        <MintUsd />
        <BurnUsd />
      </Flex>

      <WithdrawCollateral />
      <WithdrawUsd />
    </Flex>
  );
}
