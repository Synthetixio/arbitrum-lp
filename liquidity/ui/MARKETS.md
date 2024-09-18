# Markets

> Different cryptocurrencies, such as Bitcoin (BTC), Ethereum (ETH), Solana (SOL), as well as project tokens, including DeFi protocols, NFT platforms, and gaming tokens, can have their own perpetual markets, such as BTC-PERP, ETH-PERP.

Currently, we have four markets, but this number may change, so we retrieve them dynamically.

They can be found in Core/lp `e2e/deployments/extras.json`, for example:

- `eth_perps_market_id`
- `btc_perps_market_id`
- `sol_perps_market_id`
- `wif_perps_market_id`
- …

To get market data, we use the following functions of the `PerpsMarketProxy` contract:

```sh
function getMarkets() view returns (uint256[] memory marketIds) {
    // Function implementation
}

function getMarketSummary(uint128 marketId) view 
    returns (tuple(
                int256 skew, 
                uint256 size, 
                uint256 maxOpenInterest, 
                int256 currentFundingRate, 
                int256 currentFundingVelocity, 
                uint256 indexPrice) 
            memory summary) {
    // Function implementation
}

function metadata(uint128 marketId) view 
    returns (string memory name, 
             string memory symbol) {
    // Function implementation
}
```

### Response Format:

- `PerpsMarketProxy.getMarkets()`

```
[
    { "type": "BigNumber", "hex": "0x..." },
    { "type": "BigNumber", "hex": "0x..." },
  ...
]
```

- `PerpsMarketProxy.getMarketSummary()`
> Hybrid Array/Object.

```
[
  [
    BigNumber {_hex: '0x...'},  // Index 0 - Skew value
    BigNumber {_hex: '0x...'},  // Index 1 - Size value
    BigNumber {_hex: '0x...'},  // Index 2 - Max Open Interest value
    BigNumber {_hex: '0x...'},  // Index 3 - Current Funding Rate value
    BigNumber {_hex: '0x...'},  // Index 4 - Current Funding Velocity value
    BigNumber {_hex: '0x...'},  // Index 5 - Index Price value
    skew: BigNumber {_hex: '0x...'},
    size: BigNumber {_hex: '0x...'},
    maxOpenInterest: BigNumber {_hex: '0x...'},
    currentFundingRate: BigNumber {_hex: '0x...'},
    currentFundingVelocity: BigNumber {_hex: '0x...'},
    indexPrice: BigNumber {_hex: '0x...'},
  ],
  ...
]
```

- `PerpsMarketProxy.metadata()`
> Hybrid Array/Object. 

```
[
  ['Bitcoin', 'BTC', name: 'Bitcoin', symbol: 'BTC'],
  ['Solana', 'SOL', name: 'Solana', symbol: 'SOL'],
  ['dogwifhat', 'Wif', name: 'dogwifhat', symbol: 'Wif'],
  ['Ethereum', 'ETH', name: 'Ethereum', symbol: 'ETH']
]
```
