import { Flex, Heading, Text } from '@chakra-ui/react';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Accounts } from './Accounts';
import { CollateralTokens } from './CollateralTokens';
import { Deposit } from './Deposit';

export function HomePage() {
  return (
    <>
      <Helmet>
        <title>Synthetix Liquidity V3</title>
        <meta name="description" content="Synthetix V3 - Dashboard" />
      </Helmet>
      <Flex flexDir="column" mt={10}>
        <Heading color="gray.50" maxWidth="20rem" fontSize="3rem" lineHeight="120%">
          The Liquidity Layer of DeFi
        </Heading>
        <Text color="gray.500" fontSize="1rem" lineHeight={6} fontFamily="heading" mt="1rem">
          Provide liquidity for the next generation of permissionless protocols
        </Text>
      </Flex>
      <Flex flexDir="column" mt={10}>
        <Accounts />
      </Flex>
      <Flex flexDir="column" mt={10}>
        <CollateralTokens />
      </Flex>
      <Flex flexDir="column" mt={10}>
        <Deposit />
      </Flex>
    </>
  );
}

// // optionally deposit if available collateral not enough
// const deposit = collateralAmount.gt(0)
//   ? CoreProxy.populateTransaction.deposit(
//       BigNumber.from(id),
//       collateralTypeAddress,
//       collateralAmount // only deposit what's needed
//     )
//   : undefined;
//
// const delegate = CoreProxy.populateTransaction.delegateCollateral(
//   BigNumber.from(id),
//   BigNumber.from(poolId),
//   collateralTypeAddress,
//   currentCollateral.add(collateralChange).toBN(),
//   wei(1).toBN()
// );
// const callsPromise = Promise.all([createAccount, deposit, delegate].filter(notNil));
// const collateralPriceCallsPromise = fetchPriceUpdates(
//   collateralPriceUpdates,
//   network?.isTestnet
// ).then((signedData) =>
//   priceUpdatesToPopulatedTx(walletAddress, collateralPriceUpdates, signedData)
// );

// const [calls, gasPrices, collateralPriceCalls] = await Promise.all([
//   callsPromise,
//   getGasPrice({ provider }),
//   collateralPriceCallsPromise,
// ]);
// const allCalls = collateralPriceCalls.concat(calls);
//
// const erc7412Tx = await withERC7412(network, allCalls, 'useDeposit');
//
// const gasOptionsForTransaction = formatGasPriceForTransaction({
//   gasLimit: erc7412Tx.gasLimit,
//   gasPrices,
//   gasSpeed,
// });
//
// const txn = await signer.sendTransaction({ ...erc7412Tx, ...gasOptionsForTransaction });
//
