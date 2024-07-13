import {PriceChart} from "./PriceChart";
import {Trade} from "./Trade";
import {Fragment} from "react";
import {Box, Flex, Text, Select, Icon, Container} from '@chakra-ui/react';
import {ChevronDownIcon} from "@chakra-ui/icons";
import {useCollateralPrice} from "./useCollateralPrice";

export function Stats() {

    const ethPrice = 3136.32;
    // const { data: collateralPrice } = useCollateralPrice({
    //     tokenAddress: collateralType?.address,
    // });

    return <div>
        <Box bg="black" color="white" p={2} borderRadius="md" w="100%" mb={4} padding={2}>
            <Flex alignItems="center"
                  justifyContent="space-between">
                <Flex alignItems="center">
                    <Icon viewBox="0 0 200 200" color="gray.400" mr={2}>
                        <path
                            fill="currentColor"
                            d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
                        />
                    </Icon>
                    <Select fontWeight="bold" mr={2}>
                        <option value="1h">ETH-PERP</option>
                        <option value="4h">BTC-PERP</option>
                    </Select>
                </Flex>

                <Text color="green.400" fontWeight="bold" fontSize="xl" mr={4}>
                    {ethPrice.toFixed(2)}
                </Text>

                <Flex direction="column" alignItems="flex-end">
                    <Flex>
                        <Text mr={4}>Index Price $3,136.22</Text>
                        <Text color="green.400">24H Change 1.96%</Text>

                        <Text mr={4}>Long OI $1.25M/$15.00M</Text>
                        <Text mr={4}>Short OI $1.26M/$15.00M</Text>
                        <Text mr={4}>Skew 50%/50%</Text>
                        <Text>Funding Rate 0.003752%</Text>
                    </Flex>
                </Flex>

                <Select w={20} padding={2} placeholder="1H" size="sm" bg="gray.800" borderColor="gray.700">
                    <option value="1h">1H</option>
                    <option value="4h">4H</option>
                    <option value="1d">1D</option>
                </Select>
            </Flex>
        </Box>
    </div>
}