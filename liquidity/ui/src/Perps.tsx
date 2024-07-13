import { Box } from "@chakra-ui/react";
import { PriceChart } from "./PriceChart";
import { Trade } from "./Trade";

export function Perps() {
    return <div>
        <Box w="100%">
            <PriceChart />
            <Trade />
        </Box>
    </div>
}