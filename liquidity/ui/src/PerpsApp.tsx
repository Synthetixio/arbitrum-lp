import { Box } from '@chakra-ui/react';
import WebApp from '@twa-dev/sdk';
import { PerpsAppNavbar } from './PerpsAppNavbar';
import { PerpsDepositMargin } from './PerpsDepositMargin';

WebApp.ready();

export function PerpsApp() {
  return (
    <Box>
      <PerpsAppNavbar />
      <h1>PERPS APP</h1>
      <button type="button" onClick={() => WebApp.showAlert('Hello World!')}>
        Show Alert
      </button>
      <PerpsDepositMargin />
    </Box>
  );
}
