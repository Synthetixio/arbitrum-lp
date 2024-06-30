import { ethers } from 'ethers';

export function parseAmount(value: string, decimals?: number) {
  if (!decimals) {
    return ethers.BigNumber.from(0);
  }
  const filteredInput = `${value}`.replace(/[^0-9.]+/gi, '');
  if (!filteredInput) {
    return ethers.BigNumber.from(0);
  }
  try {
    return ethers.utils.parseUnits(filteredInput.trim(), decimals);
  } catch {
    return ethers.BigNumber.from(0);
  }
}
