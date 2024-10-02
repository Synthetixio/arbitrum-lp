import React from 'react';
import { useAccountLastInteraction } from './useAccountLastInteraction';
import { useAccountTimeoutWithdraw } from './useAccountTimeoutWithdraw';
import { useSelectedAccountId } from './useSelectedAccountId';

export function useWithdrawTimer() {
  const accountId = useSelectedAccountId();
  const { data: accountTimeoutWithdraw } = useAccountTimeoutWithdraw();
  const { data: accountLastInteraction } = useAccountLastInteraction({
    accountId,
  });
  const unlockUnixtime =
    accountLastInteraction && accountTimeoutWithdraw ? accountLastInteraction.add(accountTimeoutWithdraw).toNumber() : 0;
  const [h, setH] = React.useState(0);
  const [m, setM] = React.useState(0);
  const [s, setS] = React.useState(0);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      const unlockTimeout = unlockUnixtime ? unlockUnixtime - Math.floor(Date.now() / 1000) : 0;
      const hours = Math.max(0, Math.floor(unlockTimeout / 3600));
      const minutes = Math.max(0, Math.floor((unlockTimeout - hours * 3600) / 60));
      const seconds = Math.max(0, unlockTimeout - hours * 3600 - minutes * 60);
      if (hours === 0 && minutes === 0 && seconds === 0) {
        window.clearInterval(interval);
      }
      setH(hours);
      setM(minutes);
      if (hours === 0 && minutes === 0) {
        setS(seconds);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [unlockUnixtime]);

  return { h, m, s };
}
