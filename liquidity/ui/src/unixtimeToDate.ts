import type { ethers } from 'ethers';

export function unixtimeToDate(unixtime?: ethers.BigNumber): Date | undefined {
  if (!unixtime) {
    return;
  }
  const date = new Date(unixtime.mul(1000).toNumber());
  if (Number.isNaN(date.getTime())) {
    return;
  }
  return date;
}
