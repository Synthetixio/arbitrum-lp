import { ethers } from 'ethers';

export function renderAccountId(accountId?: ethers.BigNumber) {
  if (!accountId) {
    return '---';
  }
  const hex = accountId.toHexString();
  // auto-generated 0x80000000000000000000000000000008 value
  if (hex.length === 34) {
    return `0x...${hex.slice(-4)}`;
  }
  return `#${accountId}`;
}
