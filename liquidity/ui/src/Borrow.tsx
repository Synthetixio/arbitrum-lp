import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { delegateCollateral } from './delegateCollateral';
import { useErrorParser } from './parseError';
import { useAccountCollateral } from './useAccountCollateral';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useCoreProxy } from './useCoreProxy';
import { useMulticall } from './useMulticall';
import { usePositionCollateral } from './usePositionCollateral';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { usePythERC7412Wrapper } from './usePythERC7412Wrapper';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';

export function Borrow() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();

  const { data: CoreProxyContract } = useCoreProxy();

  const { data: accountCollateral, refetch: accountCollateralRefetch } = useAccountCollateral({
    accountId,
    tokenAddress: collateralType?.address,
  });

  const { data: positionCollateral, refetch: positionCollateralRefetch } = usePositionCollateral({
    accountId,
    poolId: '1',
    tokenAddress: collateralType?.address,
  });

  const errorParser = useErrorParser();
  const { data: allPriceFeeds } = useAllPriceFeeds();
  const { refetch: priceUpdateTxnRefetch } = usePriceUpdateTxn(allPriceFeeds);
  const { data: MulticallContract } = useMulticall();
  const { data: PythERC7412WrapperContract } = usePythERC7412Wrapper();

  const borrow = useMutation({
    mutationFn: async (inputAmount: string) => {
      if (
        !(
          CoreProxyContract &&
          MulticallContract &&
          PythERC7412WrapperContract &&
          allPriceFeeds &&
          connectedChain?.id &&
          walletAddress &&
          wallet?.provider &&
          accountId &&
          collateralType
        )
      ) {
        throw 'OMFG';
      }

      const filteredInput = `${inputAmount}`.replace(/[^0-9.]+/gi, '');
      const delegateAmount = filteredInput
        ? ethers.utils.parseUnits(inputAmount.trim(), collateralType.decimals)
        : ethers.BigNumber.from(0);

      if (!delegateAmount.gt(0)) {
        throw new Error('Amount required');
      }

      const freshPriceUpdateTxn = await priceUpdateTxnRefetch();
      console.log(`freshPriceUpdateTxn`, freshPriceUpdateTxn.data);
      if (!freshPriceUpdateTxn.data) {
        throw freshPriceUpdateTxn.error;
      }

      const freshAccountCollateral = await accountCollateralRefetch();
      console.log(`freshAccountCollateral`, freshAccountCollateral.data);
      if (!freshAccountCollateral.data) {
        throw freshAccountCollateral.error;
      }

      const hasEnoughDeposit = freshAccountCollateral.data.totalDeposited
        .sub(freshAccountCollateral.data.totalAssigned)
        .gte(delegateAmount);
      if (!hasEnoughDeposit) {
        throw new Error('Not enough deposit');
      }

      const freshPositionCollateral = await positionCollateralRefetch();
      console.log(`freshPositionCollateral`, freshPositionCollateral.data);
      if (!freshPositionCollateral.data) {
        throw freshPositionCollateral.error;
      }

      await delegateCollateral({
        wallet,
        CoreProxyContract,
        MulticallContract,
        accountId,
        poolId: '1',
        tokenAddress: collateralType.address,
        delegateAmount: freshPositionCollateral.data.add(delegateAmount),
        priceUpdateTxn: freshPriceUpdateTxn.data,
        errorParser,
      });

      await Promise.all([
        //
        accountCollateralRefetch(),
        positionCollateralRefetch(),
      ]);
    },
  });

  const [value, setValue] = React.useState('');

  const hasEnoughDeposit = React.useMemo(() => {
    if (
      !(
        collateralType?.decimals &&
        accountCollateral?.totalDeposited &&
        accountCollateral?.totalAssigned
      )
    ) {
      return true;
    }
    const filteredNumber = `${value}`.replace(/[^0-9.]+/gi, '');
    if (!filteredNumber) {
      return true;
    }
    return accountCollateral.totalDeposited
      .sub(accountCollateral.totalAssigned)
      .gte(ethers.utils.parseUnits(filteredNumber, collateralType.decimals));
  }, [
    value,
    collateralType?.decimals,
    accountCollateral?.totalDeposited,
    accountCollateral?.totalAssigned,
  ]);

  return (
    <>
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Borrow
        <Text as="span" ml={4} fontSize="1rem" fontWeight="normal">
          Debt:{' '}
          <b>
            {positionCollateral && collateralType
              ? ethers.utils.formatUnits(positionCollateral, collateralType.decimals)
              : ''}
          </b>
        </Text>
      </Heading>
      <Flex flexDir="column" gap={3} alignItems="flex-start">
        {borrow.isError ? (
          <Alert status="error" maxWidth="40rem">
            <AlertIcon />
            <AlertTitle>{borrow.error.message}</AlertTitle>
          </Alert>
        ) : null}

        <Stack
          spacing={4}
          as="form"
          method="POST"
          action="#"
          onSubmit={(e) => {
            e.preventDefault();
            borrow.mutate(value);
          }}
        >
          <InputGroup gap={4}>
            <Input
              required
              placeholder="Enter amount"
              value={value}
              onChange={(e) => {
                borrow.reset();
                setValue(e.target.value);
              }}
            />
            <Button type="submit" isLoading={borrow.isPending}>
              Borrow
            </Button>
          </InputGroup>
        </Stack>
      </Flex>
    </>
  );
}
