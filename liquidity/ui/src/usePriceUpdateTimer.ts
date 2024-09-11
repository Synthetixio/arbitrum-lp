import React from 'react';
import { usePerpsGetSettlementStrategy } from './usePerpsGetSettlementStrategy';

export function usePriceUpdateTimer({
  commitmentTime,
}: {
  commitmentTime?: number;
}) {
  const { data: settlementStrategy } = usePerpsGetSettlementStrategy();

  const settlementWindowDuration = settlementStrategy ? settlementStrategy.settlementWindowDuration.toNumber() : 0;
  const unlockUnixtime = commitmentTime ? commitmentTime + settlementWindowDuration : 0;

  const [h, setH] = React.useState(0);
  const [m, setM] = React.useState(0);
  const [s, setS] = React.useState(0);
  const [timerExpired, setTimerExpired] = React.useState(false);

  React.useEffect(() => {
    if (!commitmentTime) return;

    const interval = window.setInterval(() => {
      const unlockTimeout = unlockUnixtime ? unlockUnixtime - Math.floor(Date.now() / 1000) : 0;
      const hours = Math.max(0, Math.floor(unlockTimeout / 3600));
      const minutes = Math.max(0, Math.floor((unlockTimeout - hours * 3600) / 60));
      const seconds = Math.max(0, unlockTimeout - hours * 3600 - minutes * 60);

      if (hours === 0 && minutes === 0 && seconds === 0) {
        window.clearInterval(interval);
        setTimerExpired(true);
      }

      setH(hours);
      setM(minutes);
      setS(seconds);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [unlockUnixtime, commitmentTime]);

  return { h, m, s, timerExpired };
}
