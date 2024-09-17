# Deposit Margin key points

### Approving Token Allowance

The first step in the collateral modification process involves ensuring that the `PerpsMarketProxy` contract has the necessary allowance to spend our tokens(e.g., USDx). If the current allowance is less than the amount you intend to deposit (`depositAmount`), you invoke the `approveToken` function. By approving the contract to spend tokens on your behalf, you allow it to subtract the specified amount from your wallet when needed.

Upon successful execution of the `approveToken` function, the `PerpsMarketProxyContract` will be able to debit the specified number of tokens (e.g., `USDX`) from your wallet (e.g., `MetaMask`) to perform transactions, such as making a deposit.

**Note: `Token.approve(spenderAddress, allowance)`**



**Variables:**
- `spender`: Contract address (e.g., `PerpsMarketProxyContract.address`)
- `amount`: Balance to set (e.g., `0.1`)

```sh
function approve(address spender, uint256 amount) returns (bool)
```

### Modifying Collateral

Once the necessary allowance is confirmed, the `modifyCollateral` function is called on the `PerpsMarketProxy` contract. This function allows you to deposit a specified amount of tokens into your perps account (`perpsAccountId`) for a particular market. This step is crucial as it funds your account with collateral, enabling you to participate in the market for perpetual contracts.

`modifyCollateral` increases the collateral in your account, allowing you to trade on this market.

**Note: `PerpsMarketProxy.modifyCollateral(...modifyCollateralTxnArgs)`**

**Variables:**
- `accountId`: perps account id (e.g., `0x80...005`)
- `collateralId`: USDx market id = 0 (e.g., `0`)
- `amountDelta`: amount (e.g., `0.1`)

```sh
function modifyCollateral(uint128 accountId, uint128 collateralId, int256 amountDelta)
```