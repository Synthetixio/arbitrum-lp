import { ethers } from 'ethers';

export function renderAmount(
  amount?: ethers.BigNumber,
  token?: { symbol: string; decimals: number }
) {
  if (!(amount && token)) {
    return '';
  }
  if (amount.eq(0)) {
    return `0.00 ${token.symbol}`;
  }
  const float = parseFloat(ethers.utils.formatUnits(amount, token.decimals));
  if (Math.abs(float) >= 1) {
    return `${float.toFixed(2)} ${token.symbol}`;
  }
  const floatMillie = float * 1e3;
  if (Math.abs(floatMillie) >= 1) {
    return `${floatMillie.toFixed(2)} millie-${token.symbol}`;
  }
  const floatMicro = float * 1e6;
  if (Math.abs(floatMicro) >= 1) {
    return `${floatMicro.toFixed(2)} micro-${token.symbol}`;
  }
  const floatNano = float * 1e9;
  if (Math.abs(floatNano) >= 1) {
    return `${floatNano.toFixed(2)} nano-${token.symbol}`;
  }
  const floatPico = float * 1e12;
  if (Math.abs(floatPico) >= 1) {
    return `${floatPico.toFixed(2)} pico-${token.symbol}`;
  }
  return `${float.toFixed(2)} ${token.symbol}`;
}
