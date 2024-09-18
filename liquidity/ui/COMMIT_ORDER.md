# Commit Order

## Check for Expired Prices

First, check if there are expired prices.

**Note: in this case we are fetching all priceIds, not one specific.**

```javascript
import { fetchPriceUpdateTxn } from '@synthetixio/react-sdk';

const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
  provider,
  MulticallContract,
  PythERC7412WrapperContract,
  priceIds,
});
```

If there are expired prices (`freshPriceUpdateTxn.value`), then before executing the Commit Order, it is necessary to execute transactions with updated prices using `MulticallContract`.

Invoke the `commitOrderWithPriceUpdate` function. This syntax allows multiple transactions such as `priceUpdateTxn` and `commitOrderTxn` to be executed together in a single call to the `MulticallContract`.

```javascript
const commitOrderTxn = {
  //
  callData: PerpsMarketPoxyInterface.encodeFunctionData('commitOrder', [orderCommitmentArgs])
  //
};

const multicallTxn = {
  from: walletAddress,
  to: MulticallContract.address,
  data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, commitOrderTxn]]),
  value: priceUpdateTxn.value,
};
```

## If All Prices are Up-to-Date

Invoke the `commitOrder` (`PerpsMarketProxy.commitOrder(orderCommitmentArgs)`) function.

After a successful execution, be sure to update the cache for the `PerpsMarketProxy.getOrder(perpsAccountId)` call to inform the user that their account has an open order. It is also important to state that the order is in a "Pending" status, as it still needs to be **settled**.