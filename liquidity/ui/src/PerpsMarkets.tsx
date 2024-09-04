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
import { ethers } from 'ethers';
import React from 'react';
import { useMarketMetadata } from './useMarketMetadata';
import { useMarketSummary } from './useMarketSummary';
import { useMarkets } from './useMarkets';

function MarketRow({
  marketId,
  onMarketSelect,
}: {
  marketId: number;
  onMarketSelect: (marketId: number, symbol?: string) => void;
}) {
  const { data: summary } = useMarketSummary(marketId);
  const { data: metadata } = useMarketMetadata(marketId);

  return (
    <Tr
      _hover={{
        cursor: 'pointer',
        color: 'teal.500',
      }}
      onClick={() => metadata && onMarketSelect(marketId, metadata.symbol)}
    >
      <Td>{metadata?.symbol ?? ''}</Td>
      <Td isNumeric>{summary ? ethers.utils.commify(ethers.utils.formatUnits(summary.maxOpenInterest)) : ''}</Td>
      <Td isNumeric>{summary ? ethers.utils.commify(ethers.utils.formatUnits(summary.size)) : ''}</Td>
    </Tr>
  );
}

export function PerpsMarkets() {
  const { data: marketIds } = useMarkets();
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
                        key={marketId}
                        marketId={marketId}
                        onMarketSelect={(marketId: number, symbol?: string) => {
                          setParams({ ...params, market: String(marketId) });
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
