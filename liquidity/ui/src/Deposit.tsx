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
import { approveToken } from './approveToken';
import { depositCollateral } from './depositCollateral';
import { useAccountCollateral } from './useAccountCollateral';
import { useCoreProxy } from './useCoreProxy';
import { usePositionCollateral } from './usePositionCollateral';
import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useTokenAllowance } from './useTokenAllowance';
import { useTokenBalance } from './useTokenBalance';

export function Deposit() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();

  const { data: CoreProxyContract } = useCoreProxy();

  const { data: currentAllowance, refetch: tokenAllowanceRefetch } = useTokenAllowance({
    ownerAddress: walletAddress,
    tokenAddress: collateralType?.address,
    spenderAddress: CoreProxyContract?.address,
  });

  const { refetch: tokenBalanceRefetch } = useTokenBalance({
    ownerAddress: walletAddress,
    tokenAddress: collateralType?.address,
  });

  const { data: accountCollateral, refetch: accountCollateralRefetch } = useAccountCollateral({
    accountId,
    tokenAddress: collateralType?.address,
  });

  const { refetch: positionCollateralRefetch } = usePositionCollateral({
    accountId,
    poolId: '1',
    tokenAddress: collateralType?.address,
  });

  const deposit = useMutation({
    mutationFn: async (inputAmount: string) => {
      if (!(wallet && CoreProxyContract && connectedChain?.id && accountId && collateralType)) {
        throw 'OMFG';
      }

      const filteredInput = `${inputAmount}`.replace(/[^0-9.]+/gi, '');
      const depositAmount = filteredInput
        ? ethers.utils.parseUnits(inputAmount.trim(), collateralType.decimals)
        : ethers.BigNumber.from(0);

      if (!depositAmount.gt(0)) {
        throw new Error('Amount required');
      }

      const freshBalance = await tokenBalanceRefetch();
      if (!freshBalance.data) {
        throw freshBalance.error;
      }
      if (freshBalance.data.lt(depositAmount)) {
        throw new Error('Not enough balance');
      }
      const freshAllowance = await tokenAllowanceRefetch();
      if (!freshAllowance.data) {
        throw freshAllowance.error;
      }

      if (freshAllowance.data.lt(depositAmount)) {
        await approveToken({
          wallet,
          tokenAddress: collateralType.address,
          spenderAddress: CoreProxyContract.address,
          allowance: depositAmount.sub(freshAllowance.data),
        });
      }

      await depositCollateral({
        wallet,
        CoreProxyContract,
        accountId,
        tokenAddress: collateralType.address,
        depositAmount,
      });

      await Promise.all([
        //
        accountCollateralRefetch(),
        positionCollateralRefetch(),
      ]);
    },
  });

  const [value, setValue] = React.useState('');

  const hasEnoughAllowance = React.useMemo(() => {
    if (!(collateralType?.decimals && currentAllowance)) {
      return true;
    }
    const filteredNumber = `${value}`.replace(/[^0-9.]+/gi, '');
    if (!filteredNumber) {
      return true;
    }
    return currentAllowance.gte(ethers.utils.parseUnits(filteredNumber, collateralType.decimals));
  }, [value, collateralType?.decimals, currentAllowance]);

  return (
    <>
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Deposit
        <Text as="span" ml={4} fontSize="1rem" fontWeight="normal">
          Deposited:{' '}
          <b>
            {accountCollateral && collateralType
              ? ethers.utils.formatUnits(accountCollateral.totalDeposited, collateralType.decimals)
              : ''}
          </b>
        </Text>
      </Heading>
      <Flex flexDir="column" gap={3} alignItems="flex-start">
        {deposit.isError ? (
          <Alert status="error" maxWidth="40rem">
            <AlertIcon />
            <AlertTitle>{deposit.error.message}</AlertTitle>
          </Alert>
        ) : null}

        <Stack
          spacing={4}
          as="form"
          method="POST"
          action="#"
          onSubmit={(e) => {
            e.preventDefault();
            deposit.mutate(value);
          }}
        >
          <InputGroup gap={4}>
            <Input
              required
              placeholder="Enter amount"
              value={value}
              onChange={(e) => {
                deposit.reset();
                setValue(e.target.value);
              }}
            />
            <Button type="submit" isLoading={deposit.isPending}>
              {hasEnoughAllowance ? 'Deposit' : 'Approve and Deposit'}
            </Button>
          </InputGroup>
        </Stack>
      </Flex>
    </>
  );
}
