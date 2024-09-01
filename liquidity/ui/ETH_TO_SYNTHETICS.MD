## Trading Process Overview

This application allows users to engage in perpetual contracts (perps) trading using synthetic assets. The following steps describe the process of converting Ethereum (ETH) into various forms of tokens to participate in trading:

### 1. Get ETH
The first step involves getting Ethereum (ETH). This can be done by purchasing ETH on an exchange or transferring it from another wallet.

### 2. Convert ETH to WETH (Wrapped ETH)
Ethereum (ETH) is not an ERC-20 token, which limits its usage in some smart contracts and decentralized applications (dApps). To make ETH compatible, it can be "wrapped" into WETH, an ERC-20 token that fully adheres to the ERC-20 standard.

### 3. Wrap WETH into sETH (Synthetic ETH)
WETH is then converted into sETH (Synthetic ETH), a synthetic asset backed by a protocol such as Synthetix. sETH can be utilized for trading in various pairs, particularly in synthetic and derivative markets. This conversion is typically performed using a smart contract.

`SpotMarketProxy` Contract, function - `wrap`.

### 4. Sell sETH for USDx
Finally, synthetic ETH (sETH) can be sold for synthetic dollars (USDx) or another stable token using the market method.

`SpotMarketProxy` Contract, function - `sell`.

---

### Why This Matters?

The steps above are key for users who want to use ETH to trade on synthetic markets and with derivative contracts. This method offers more flexibility for trading, hedging, and adding liquidity on our perps trading platform.

---

By following these steps, users can efficiently convert their ETH into synthetic assets and participate in the markets supported by our application.