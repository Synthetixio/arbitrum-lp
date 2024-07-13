import { Box } from "@chakra-ui/react";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

export function PriceChart() {
  const marketSymbol = "ETH";

  return (
    <Box height="100%" w="100%">
      <AdvancedRealTimeChart
        theme="dark"
        autosize
        symbol={`PYTH:${marketSymbol?.toUpperCase()}USD`}
      ></AdvancedRealTimeChart>
    </Box>
  );
}
