import { Alert, AlertIcon, Box, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { useImportExtras, useImportSystemToken, usePerpsGetOrder, usePerpsSelectedAccountId } from '@synthetixio/react-sdk';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { PerpsSettleOrder } from './PerpsSettleOrder';
import { renderAmount } from './renderAmount';
import { usePerpsGetSettlementStrategy } from './usePerpsGetSettlementStrategy';
import { useProvider } from './useProvider';

export function PerpsOrder() {
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = useProvider();
  const [params] = useParams();
  const perpsAccountId = usePerpsSelectedAccountId({ provider, walletAddress, perpsAccountId: params.perpsAccountId });
  const order = usePerpsGetOrder({
    provider,
    perpsAccountId,
  });
  const { data: systemToken } = useImportSystemToken();
  const { data: extras } = useImportExtras();
  const { data: settlementStrategy } = usePerpsGetSettlementStrategy({ settlementStrategyId: extras?.eth_pyth_settlement_strategy });

  if (order.isPending) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text>Loading order details...</Text>
      </Box>
    );
  }

  if (order.isError) {
    return (
      <Alert status="error">
        <AlertIcon />
        {order.error.message}
      </Alert>
    );
  }

  const { commitmentTime, request } = order.data;
  const commitmentDate = new Date(commitmentTime.mul(1000).toNumber()).toLocaleString('en-GB');

  const settlementWindowDuration = settlementStrategy?.settlementWindowDuration ?? ethers.BigNumber.from(0);
  const settlementDeadline = commitmentTime ? commitmentTime.add(settlementWindowDuration) : ethers.BigNumber.from(0);

  if (settlementDeadline.lt(Math.floor(Date.now() / 1000))) {
    return null;
  }

  if (!request.sizeDelta || request.sizeDelta.isZero()) {
    return null;
  }

  return (
    <Box p={5} shadow="md" borderWidth="1px" mt="5%">
      <VStack align="start">
        <Heading size="md">Pending Order</Heading>
        <Text>
          Commitment Time: {commitmentTime.toString()} (Readable: {commitmentDate})
        </Text>
        <Text>Market ID: {request.marketId.toString()}</Text>
        <Text>Account ID: {request.accountId.toHexString()}</Text>
        <Text>
          Size Delta: {renderAmount(request.sizeDelta, systemToken && { symbol: systemToken.symbol, decimals: systemToken.decimals })}
        </Text>
        <Text>Settlement Strategy ID: {request.settlementStrategyId.toString()}</Text>
        <Text>
          Acceptable Price:{' '}
          {renderAmount(request.acceptablePrice, systemToken && { symbol: systemToken.symbol, decimals: systemToken.decimals })}
        </Text>
        <Text>Tracking Code: {ethers.utils.parseBytes32String(request.trackingCode)}</Text>
        <Text>Referrer: {request.referrer}</Text>
      </VStack>
      <PerpsSettleOrder commitmentTime={commitmentTime} />
    </Box>
  );
}
