import { Box, Container, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import React from 'react';
import { PerpsAppNavbar } from './PerpsAppNavbar';
import { PerpsCommitOrder } from './PerpsCommitOrder';
import { PerpsDepositMargin } from './PerpsDepositMargin';
import { PerpsSellSETHToUSDX } from './PerpsSellSETHToUSDX';
import { PerpsSetWETHTokenBalance } from './PerpsSetWETHTokenBalance';
import { PerpsWrapWETHCollateral } from './PerpsWrapWETHCollateral';

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
        <Box>
          <Tabs index={tabIndex} onChange={handleTabsChange}>
            <TabList>
              <Tab>Deposit margin (USDx)</Tab>
              <Tab>ETH to Synthetic</Tab>
              <Tab>Commit Order</Tab>
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
              <TabPanel>
                <PerpsCommitOrder />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>
    </Box>
  );
}
