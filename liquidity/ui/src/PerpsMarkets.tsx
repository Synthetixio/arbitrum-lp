import {
  Button,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { usePerpsGetMarketSummary, usePerpsGetMarkets, usePerpsMetadata } from '@synthetixio/react-sdk';
import { ethers } from 'ethers';
import React from 'react';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useProvider } from './useProvider';

function MarketRow({
  perpsMarketId,
  onMarketSelect,
}: {
  perpsMarketId: ethers.BigNumber;
  onMarketSelect: (perpsMarketId: ethers.BigNumber, symbol?: string) => void;
}) {
  const provider = useProvider();
  const { data: priceIds } = useAllPriceFeeds();
  const { data: summary } = usePerpsGetMarketSummary({ provider, priceIds, perpsMarketId });
  const { data: metadata } = usePerpsMetadata({ provider, perpsMarketId });

  return (
    <Tr
      _hover={{
        cursor: 'pointer',
        color: 'teal.500',
      }}
      onClick={() => metadata && onMarketSelect(perpsMarketId, metadata.symbol)}
    >
      <Td>{metadata?.symbol ?? ''}</Td>
      <Td isNumeric>{summary ? ethers.utils.commify(ethers.utils.formatUnits(summary.maxOpenInterest)) : ''}</Td>
      <Td isNumeric>{summary ? ethers.utils.commify(ethers.utils.formatUnits(summary.size)) : ''}</Td>
    </Tr>
  );
}

export function PerpsMarkets() {
  const provider = useProvider();
  const { data: marketIds } = usePerpsGetMarkets({ provider });
  const [params, setParams] = useParams();
  const [selectedMarket, setSelectedMarket] = React.useState('Market');

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="text">{selectedMarket}</Button>
      </PopoverTrigger>
      <PopoverContent bg="navy.900">
        <PopoverArrow />
        <PopoverBody>
          <TableContainer>
            <Table size="sm" colorScheme="whiteAlpha">
              <Thead>
                <Tr>
                  <Th>Market</Th>
                  <Th isNumeric>Max Open Interest</Th>
                  <Th isNumeric>Market size</Th>
                </Tr>
              </Thead>
              <Tbody>
                {marketIds && marketIds.length > 0
                  ? marketIds.map((marketId) => (
                      <MarketRow
                        key={marketId.toString()}
                        perpsMarketId={marketId}
                        onMarketSelect={(marketId: ethers.BigNumber, symbol?: string) => {
                          setParams({ ...params, market: marketId.toString() });
                          setSelectedMarket(symbol ? `${symbol}-PERP` : 'Market');
                        }}
                      />
                    ))
                  : null}
              </Tbody>
            </Table>
          </TableContainer>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
