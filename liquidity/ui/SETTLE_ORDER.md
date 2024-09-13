# Settle order

After committing an order, you have only 60 seconds to settle it. This duration is determined by the parameter:

```sh
"big_cap_settlement_window_duration": "60"
```

## Check for Expired Prices

We need to **check if the price of the currently selected `feedId` asset** (e.g., ETH/USD) **at a given `timestamp`** **is expired**. Because we are doing the check only for a **specific asset** and a **specific `timestamp`**, we call it **strict**. Also, in this case, we should use **`updateType = 2`**.

```javascript
const timestamp = commitmentTime.add(commitmentPriceDelay);
const offchainData = await getPythVaa({ pythPriceFeedId: feedId, timestamp: timestamp.toNumber() });
const updateType = 2;
const offchainDataEncoded = ethers.utils.defaultAbiCoder.encode(
  ['uint8', 'uint64', 'bytes32[]', 'bytes[]'],
  [updateType, timestamp, [feedId], [offchainData]]
);
```

If there are expired price (`freshStrictPriceUpdateTxn.value`), then before executing the Settle Order, it is necessary to execute transactions with updated prices using `MulticallContract`.

Invoke the `settleOrderWithPriceUpdate` function. This syntax allows multiple transactions such as `priceUpdateTxn` and `settleOrderTxn` to be executed together in a single call to the `MulticallContract`.

```javascript
const settleOrderTxn = {
  //
  callData: PerpsMarketPoxyInterface.encodeFunctionData('settleOrder', [perpsAccountId]),
  //
};

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, settleOrderTxn]]),
    value: priceUpdateTxn.value,
  };
```

## If All Prices are Up-to-Date

Invoke the `settleOrder` (`PerpsMarketProxy.settleOrder(perpsAccountId)`) function.

After successful execution, be sure to refresh the cache for `PerpsMarketProxy.getOrder(perpsAccountId)` and call to update the status of the previously opened order. Also, you need to refresh the cache and call `PerpsMarketProxy.getOpenPosition(perpsAccountId, params.market)` to update the UI and show the user the details of the open position.