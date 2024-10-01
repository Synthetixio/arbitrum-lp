import { useParams } from '@snx-v3/useParams';
import { usePerpsGetSettlementStrategy } from '@synthetixio/react-sdk';
import { ethers } from 'ethers';
import React from 'react';
import { useProvider } from './useProvider';

export function usePriceUpdateTimer({
  commitmentTime,
  settlementStrategyId,
}: {
  commitmentTime?: ethers.BigNumber;
  settlementStrategyId?: string;
}) {
  const [params] = useParams();
  const provider = useProvider();
  const { data: settlementStrategy } = usePerpsGetSettlementStrategy({ provider, perpsMarketId: params.market, settlementStrategyId });

  const settlementWindowDuration = settlementStrategy?.settlementWindowDuration ?? ethers.BigNumber.from(0);
  const unlockUnixtime = commitmentTime ? commitmentTime.add(settlementWindowDuration) : ethers.BigNumber.from(0);

  const [h, setH] = React.useState(0);
  const [m, setM] = React.useState(0);
  const [s, setS] = React.useState(0);

  React.useEffect(() => {
    if (!commitmentTime) return;

    const interval = window.setInterval(() => {
      const unlockTimeout = unlockUnixtime ? unlockUnixtime.toNumber() - Math.floor(Date.now() / 1000) : 0;
      const hours = Math.max(0, Math.floor(unlockTimeout / 3600));
      const minutes = Math.max(0, Math.floor((unlockTimeout - hours * 3600) / 60));
      const seconds = Math.max(0, unlockTimeout - hours * 3600 - minutes * 60);

      if (hours === 0 && minutes === 0 && seconds === 0) {
        window.clearInterval(interval);
      }

      setH(hours);
      setM(minutes);
      setS(seconds);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [unlockUnixtime, commitmentTime]);

  return { h, m, s };
}
