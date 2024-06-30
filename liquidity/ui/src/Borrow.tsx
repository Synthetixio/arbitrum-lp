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
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useSelectedPoolId } from './useSelectedPoolId';

export function Borrow() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();
  const poolId = useSelectedPoolId();

  const { data: CoreProxyContract } = useCoreProxy();

  const { data: accountCollateral, refetch: accountCollateralRefetch } = useAccountCollateral({
    accountId,
    tokenAddress: collateralType?.address,
  });

  const { data: positionCollateral, refetch: positionCollateralRefetch } = usePositionCollateral({
    accountId,
    poolId,
    tokenAddress: collateralType?.address,
  });

  const errorParser = useErrorParser();
  const { data: allPriceFeeds } = useAllPriceFeeds();
  const { refetch: priceUpdateTxnRefetch } = usePriceUpdateTxn(allPriceFeeds);
  const { data: MulticallContract } = useMulticall();
  const { data: PythERC7412WrapperContract } = usePythERC7412Wrapper();

  const queryClient = useQueryClient();
  const borrow = useMutation({
    mutationFn: async (inputAmount: string): Promise<{ priceUpdated: boolean }> => {
      return { priceUpdated: false };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: async ({ priceUpdated }) => {
      if (priceUpdated) {
      }
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
          <InputGroup gap={3}>
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
