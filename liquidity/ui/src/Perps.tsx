import { Box } from "@chakra-ui/react";
import { PriceChart } from "./PriceChart";
import { Trade } from "./Trade";
import { Stats } from "./Stats";

export function Perps() {
    return <div>
        <Box w="100%">
            <Stats />
            <PriceChart />
            <Trade />
        </Box>
    </div>
}