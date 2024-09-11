import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';

const PYTH_MAINNET_ENDPOINT = process.env.PYTH_MAINNET_ENDPOINT || 'https://hermes.pyth.network';

const priceService = new EvmPriceServiceConnection(PYTH_MAINNET_ENDPOINT);

function base64ToHex(str: string) {
  const raw = Buffer.from(str, 'base64');
  return `0x${raw.toString('hex')}`;
}

export async function getPythVaa({ pythPriceFeedId, timestamp }: { pythPriceFeedId: string; timestamp: number }) {
  const [priceUpdateData] = await priceService.getVaa(pythPriceFeedId, timestamp);
  return base64ToHex(priceUpdateData);
}
