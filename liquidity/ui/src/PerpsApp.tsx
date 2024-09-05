import { Box, Container, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import WebApp from '@twa-dev/sdk';
import React from 'react';
import { PerpsAppNavbar } from './PerpsAppNavbar';
import { PerpsDepositMargin } from './PerpsDepositMargin';
import { PerpsSellSETHToUSDX } from './PerpsSellSETHToUSDX';
import { PerpsSetWETHTokenBalance } from './PerpsSetWETHTokenBalance';
import { PerpsWrapWETHCollateral } from './PerpsWrapWETHCollateral';

WebApp.ready();

export function PerpsApp() {
  const [tabIndex, setTabIndex] = React.useState<number>(() => {
    const savedIndex = localStorage.getItem('tabIndex');
    return savedIndex !== null ? JSON.parse(savedIndex) : 0;
  });

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
    localStorage.setItem('tabIndex', JSON.stringify(index));
  };

  return (
    <Box>
      <PerpsAppNavbar />
      <Container maxW={'3xl'}>
        <button type="button" onClick={() => WebApp.showAlert('Hello World!')}>
          Show Alert
        </button>
        <Box>
          <Tabs index={tabIndex} onChange={handleTabsChange}>
            <TabList>
              <Tab>Deposit margin (USDx)</Tab>
              <Tab>ETH to Synthetic</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <PerpsDepositMargin />
              </TabPanel>
              <TabPanel>
                <PerpsSetWETHTokenBalance />
                <PerpsWrapWETHCollateral />
                <PerpsSellSETHToUSDX />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>
    </Box>
  );
}
