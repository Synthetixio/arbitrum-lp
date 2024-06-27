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
import { approveToken } from './approveToken';
import { depositCollateral } from './depositCollateral';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useAccountCollateral } from './useAccountCollateral';
import { useCoreProxy } from './useCoreProxy';
import { usePositionCollateral } from './usePositionCollateral';

import { useSelectedAccountId } from './useSelectedAccountId';
import { useSelectedCollateralType } from './useSelectedCollateralType';
import { useTokenAllowance } from './useTokenAllowance';

export function Deposit() {
  const [{ connectedChain }] = useSetChain();
  const [{ wallet }] = useConnectWallet();
  const walletAddress = wallet?.accounts?.[0]?.address;

  const accountId = useSelectedAccountId();
  const collateralType = useSelectedCollateralType();

  const { data: CoreProxyContract } = useCoreProxy();

  const { data: currentAllowance } = useTokenAllowance({
    ownerAddress: walletAddress,
    tokenAddress: collateralType?.address,
    spenderAddress: CoreProxyContract?.address,
  });

  const queryClient = useQueryClient();

  const { data: accountCollateral, refetch: accountCollateralRefetch } = useAccountCollateral({
    accountId,
    tokenAddress: collateralType?.address,
  });

  const { data: positionCollateral, refetch: positionCollateralRefetch } = usePositionCollateral({
    accountId,
    poolId: '1',
    tokenAddress: collateralType?.address,
  });

  const deposit = useMutation({
    mutationFn: async (inputAmount: string) => {
      if (
        !(
          CoreProxyContract &&
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
      const depositAmount = filteredInput
        ? ethers.utils.parseUnits(inputAmount.trim(), collateralType.decimals)
        : ethers.BigNumber.from(0);

      if (!depositAmount.gt(0)) {
        throw new Error('Amount required');
      }

      const provider = new ethers.providers.Web3Provider(wallet.provider);

      const freshBalance = await fetchTokenBalance({
        provider,
        tokenAddress: collateralType.address,
        ownerAddress: walletAddress,
      });
      queryClient.setQueryData(
        [
          connectedChain.id,
          'Balance',
          { tokenAddress: collateralType.address, ownerAddress: walletAddress },
        ],
        freshBalance
      );
      if (freshBalance.lt(depositAmount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        provider,
        tokenAddress: collateralType.address,
        ownerAddress: walletAddress,
        spenderAddress: CoreProxyContract.address,
      });
      queryClient.setQueryData(
        [
          connectedChain.id,
          'Allowance',
          {
            tokenAddress: collateralType.address,
            ownerAddress: walletAddress,
            spenderAddress: CoreProxyContract.address,
          },
        ],
        freshAllowance
      );

      const signer = provider.getSigner(walletAddress);

      if (freshAllowance.lt(depositAmount)) {
        await approveToken({
          signer,
          tokenAddress: collateralType.address,
          spenderAddress: CoreProxyContract.address,
          allowance: depositAmount.sub(freshAllowance),
        });
      }

      await depositCollateral({
        signer,
        accountId,
        tokenAddress: collateralType.address,
        depositAmount,
      });

      accountCollateralRefetch();
      positionCollateralRefetch();
    },
  });

  const [value, setValue] = React.useState('');

  const hasEnoughAllowance = React.useMemo(() => {
    const filteredNumber = `${value}`.replace(/[^0-9.]+/gi, '');
    return filteredNumber && collateralType?.decimals
      ? currentAllowance.gte(ethers.utils.parseUnits(filteredNumber, collateralType.decimals))
      : true;
  }, [value, collateralType?.decimals]);

  return (
    <>
      <Heading color="gray.50" fontSize="2rem" lineHeight="120%">
        Deposit
        <Text fontSize="1rem">
          Total Deposited:{' '}
          {accountCollateral && collateralType
            ? ethers.utils.formatUnits(accountCollateral.totalDeposited, collateralType.decimals)
            : ''}
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
          {/*
          <Text>
            Delegated to the pool:{' '}
            {positionCollateral && collateralType
              ? ethers.utils.formatUnits(positionCollateral, collateralType.decimals)
              : ''}
          </Text>
          <Text>
            Total Deposited:{' '}
            {accountCollateral && collateralType
              ? ethers.utils.formatUnits(accountCollateral.totalDeposited, collateralType.decimals)
              : ''}
          </Text>
          <Text>
            Total Delegated:{' '}
            {accountCollateral && collateralType
              ? ethers.utils.formatUnits(accountCollateral.totalAssigned, collateralType.decimals)
              : ''}
          </Text>
          <Text>
            Total Locked:{' '}
            {accountCollateral && collateralType
              ? ethers.utils.formatUnits(accountCollateral.totalLocked, collateralType.decimals)
              : ''}
          </Text>
*/}
          <InputGroup>
            <Input
              required
              placeholder="Enter amount"
              value={value}
              onChange={(e) => {
                deposit.reset();
                setValue(e.target.value);
              }}
            />
          </InputGroup>
          <InputGroup>
            <Button type="submit" isLoading={deposit.isPending}>
              {hasEnoughAllowance ? 'Deposit' : 'Approve and Deposit'}
            </Button>
          </InputGroup>
        </Stack>
      </Flex>
    </>
  );
}
