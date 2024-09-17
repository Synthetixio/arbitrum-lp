## Trading Process Overview

This application allows users to engage in perpetual contracts (perps) trading using synthetic assets. Below is a step-by-step guide for converting Ethereum (ETH) into synthetic assets and participating in trading.

---

### Step 1: Acquire ETH

Users need to start by obtaining Ethereum (ETH). This can be done by:
- **Purchasing ETH** on a cryptocurrency exchange.
- **Transferring ETH** from another wallet.

---

### Step 2: Convert ETH to WETH (Wrapped ETH)

Since Ethereum (ETH) is not an ERC-20 token, it needs to be "wrapped" into WETH, which is an ERC-20 compliant token. WETH is compatible with many decentralized applications (dApps) and smart contracts, making it more universal for trading.

- **Why wrap ETH?**  
  Many decentralized protocols only accept ERC-20 tokens, so converting ETH into WETH allows you to interact with these protocols, including synthetic markets.

**Code Example:**
```javascript
const Token = new ethers.Contract(tokenWETH?.address, ['function deposit() payable'], signer);
const tx = await Token.deposit({
  value: amount,
});
```

---

### Step 3: Wrap WETH into sETH (Synthetic ETH)
Once WETH is received, it can be wrapped into sETH (Synthetic ETH), a synthetic asset backed by protocols like Synthetix. sETH is primarily used in synthetic markets and perps trading for greater flexibility.

- **Why wrap WETH to sETH?**  
  sETH is a synthetic representation of ETH that can be used in various derivative trading strategies. It allows users to speculate, hedge, or provide liquidity in synthetic markets.

**Code Example:**
```sh
function wrap(
  uint128 marketId,
  uint256 wrapAmount,
  uint256 minAmountReceived
) 
  returns (
    uint256 amountToMint, 
    tuple(
      uint256 fixedFees, 
      uint256 utilizationFees, 
      int256 skewFees, 
      int256 wrapperFees
    ) fees
  )
```
- **Variables:**
    - `marketId`: Unique identifier for the sETH market, `extras.synth_eth_market_id` (e.g. `5`).
    - `wrapAmount`: Amount of WETH to wrap.
    - `minAmountReceived`: Minimum amount of sETH to receive.

---

- ### Step 4: Sell sETH for USDx

After receiving sETH, users can sell it for USDx, a synthetic stablecoin or another stable token. This process allows users to exit their position in ETH and enter a more stable synthetic asset like USDx.

- **Why sell sETH for USDx?**  
  USDx is used for trading in the Synthetix ecosystem.

**Note:** Before executing the `SpotMarketProxy.sell()`, the price validity must be verified to ensure the prices are up-to-date. If the prices are stale, an Oracle (Pyth) update will be required.

### Fetch Updated Prices

To get updated prices, use the `fetchPriceUpdateTxn` function with the following parameters:

```typescript
fetchPriceUpdateTxn({
  provider,
  MulticallContract,
  PythERC7412WrapperContract,
  priceIds,
  stalenessTolerance,
});
```

#### Parameters:

- **provider**: Web3Provider-compatible provider.
- **MulticallContract**: Contract that combines multiple transactions into a single call to increase efficiency.
- **PythERC7412WrapperContract**: ERC-7412 standard combines on-chain and off-chain data retrieval. It allows smart contracts to encourage users to retrieve necessary data off-chain (e.g., updated price feeds) and pass it back to the contract in transactions.
- **priceIds**: An array of strings representing price feed identifiers. (e.g. `0xff....0ace`).
- **stalenessTolerance**: Defines how old the data can be while still being usable. It sets a limit on how long the data remains valid after it was last updated. (e.g. `60`) - 60 seconds.

#### Getting Some Important Parameters

##### `priceIds`

To get `priceIds`, call the `getSettlementStrategy` method of the SpotMarketProxy contract (`SpotMarketProxy.getSettlementStrategy()`) and use the value by the `feedId` key from the response.

- **marketId**: Get from `extras.synth_eth_market_id`
- **strategyId**: Get from `extras.eth_pyth_settlement_strategy`

```sh
function getSettlementStrategy(
  uint128 marketId,
  uint256 strategyId
) view returns (
  tuple(
    uint8 strategyType,
    uint256 settlementDelay,
    uint256 settlementWindowDuration,
    address priceVerificationContract,
    bytes32 feedId,
    string url,
    uint256 settlementReward,
    uint256 priceDeviationTolerance,
    uint256 minimumUsdExchangeAmount,
    uint256 maxRoundingLoss,
    bool disabled
  ) settlementStrategy
);
```

##### `stalenessTolerance`

To get `stalenessTolerance`, refer to the `getPriceData` method of the SpotMarketProxy contract (`SpotMarketProxy.getPriceData()`) and use the value from the `strictPriceStalenessTolerance` key in the response.

```sh
function getPriceData(
  uint128 synthMarketId
) view returns (
  bytes32 buyFeedId,
  bytes32 sellFeedId,
  uint256 strictPriceStalenessTolerance
);
```

- **synthMarketId**: Get from `extras.synth_eth_market_id`

Now that the origin of the parameters is known and understood, we can return to the sales call.

```sh
function sell(
  uint128 marketId,
  uint256 synthAmount,
  uint256 minUsdAmount,
  address referrer
) 
  returns (
    uint256 usdAmountReceived, 
    tuple(
      uint256 fixedFees, 
      uint256 utilizationFees, 
      int256 skewFees, 
      int256 wrapperFees
    ) fees
  )
```

- **Variables:**
    - `marketId`: Identifier for the sETH market, `extras.synth_eth_market_id` (e.g. `5`).
    - `synthAmount`: Amount of sETH to sell.
    - `minUsdAmount`: Minimum amount of USDx to receive.
    - `referrer`: Address for tracking referrals (e.g., `ethers.constants.AddressZero`).

---

- **Why This Matters?**  
  These steps help users trade ETH easily in synthetic markets, giving more flexibility and better control over risks, with access to more trading options.  
  By following this guide, users can quickly convert ETH into synthetic assets and start trading on our platform, offering new opportunities for trading, providing liquidity, and managing risks.

**Key Points:**

- WETH makes ETH compatible with ERC-20 contracts.
- sETH allows for synthetic asset trading and is essential for perps trading.
- USDx provides stability when exiting synthetic ETH positions.