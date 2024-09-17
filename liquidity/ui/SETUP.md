# Setup Core / LP

### Build and Upgrade Project - Arbitrum Sepolia Network

**Environment Variables:**
- `INFURA_API_KEY`: Your Infura API Key.

**Build Command:**
```sh
cannon build omnibus-arbitrum-sepolia.toml \
    --keep-alive \
    --dry-run \
    --port 8545 \
    --upgrade-from synthetix-omnibus:latest@main \
    --chain-id 421614 \
    --provider-url https://arbitrum-sepolia.infura.io/v3/$INFURA_API_KEY
```

---

### Debugging

**Note: Optional**
```sh
export DEBUG='e2e:*'
```

---

### Set Ethereum Balance

**Environment Variables:**
- `WALLET_ADDRESS`: Wallet address (e.g. from MetaMask, `0x8aED6...9Dcfb`)
- `BALANCE`: Balance to set (e.g., `100`)

**Note: `anvil_setBalance`**

**Command:**
```sh
node ./e2e/tasks/setEthBalance.js $WALLET_ADDRESS $BALANCE
```

---

### Set Mintable Token Balance

**Environment Variables:**
- `PK`: Private Key.
- `TOKEN_ADDRESS`: Token address (e.g., fARB: `0x7b356eEdABc1035834cd1f714658627fcb4820E3`)
- `BALANCE`: Balance to set (e.g., `10000`)

**Command:**
```sh
node ./e2e/tasks/setMintableTokenBalance.js $PK $TOKEN_ADDRESS $BALANCE
```

---

### Fetch Collateral Balance

**Note: Optional**

**Environment Variables:**
- `WALLET_ADDRESS`: Wallet address (e.g. from MetaMask, `0x8aED6...9Dcfb`)
- `SYMBOL`: Collateral token symbol (e.g., `USDx`)

**Note:** This function call is for testing purposes, and the `value` parameter should start with the digit 0.

**Command:**
```sh
node ./e2e/tasks/getCollateralBalance.js $WALLET_ADDRESS $SYMBOL
```

---

### Get Perps Collateral

**Environment Variables:**

**Parameters:**
- `ACCOUNT_ID`: Account identifier. (e.g. from MetaMask, `0x8aED6...9Dcfb`)
- `MARKET_ID`: Market identifier. (e.g., `100`). This is available in the `e2e/deployments/extras.json` file under the key `"eth_perps_market_id"`.

**Note: `PerpsMarketProxy` Contract**

**Command:**
```sh
node e2e/tasks/getPerpsCollateral.js $ACCOUNT_ID $MARKET_ID
```

---

### Set Configuration Uint

**Note: Optional**

**Environment Variables:**
- `CONFIG_KEY`: Configuration key (e.g., `accountTimeoutWithdraw`)
- `VALUE`: Uint value to set (e.g., `0x00`)
- 
  **Note: `CoreProxy` Contract**

**Command:**
```sh
node e2e/tasks/setConfigUint.js $CONFIG_KEY $VALUE
```

---

### Create an Account

**Environment Variables:**
- `PK`: Private Key.
- `ACC`: Account identifier (e.g., `777`)

**Note: `CoreProxy` Contract**

**Command:**
```sh
node e2e/tasks/createAccount.js $PK $ACC
```

---

### Deposit Collateral

**Environment Variables:**
- `PRIVATE_KEY`: Private Key (e.g., `your_private_key`)
- `ACCOUNT_ID`: Account identifier (e.g., `777`)
- `SYMBOL`: Collateral token symbol (e.g., `fARB`)
- `AMOUNT`: Amount to deposit (e.g., `200`)

**Note: `CoreProxy` Contract**

**Command:**
```sh
node e2e/tasks/depositCollateral.js $PRIVATE_KEY $ACCOUNT_ID $SYMBOL $AMOUNT
```

---

### Delegate Collateral

**Environment Variables:**
- `PRIVATE_KEY`: Private Key (e.g., `your_private_key`)
- `ACCOUNT_ID`: Account identifier (e.g., `777`)
- `SYMBOL`: Collateral token symbol (e.g., `fARB`)
- `AMOUNT`: Amount to delegate (e.g., `200`)
- `POOL_ID`: Pool identifier (e.g., `1`)

**Note: `CoreProxy` Contract**

**Command:**
```sh
node e2e/tasks/delegateCollateral.js $PRIVATE_KEY $ACCOUNT_ID $SYMBOL $AMOUNT $POOL_ID
```