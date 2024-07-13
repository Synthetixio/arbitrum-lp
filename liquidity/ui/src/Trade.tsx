import { Box, Button, FormControl, FormHelperText, FormLabel, Input, InputGroup, InputLeftAddon, InputRightAddon, Radio, RadioGroup, Select, Stack } from "@chakra-ui/react";
import React from "react";
import { PerpsUserMenu } from "./PerpsUserMenu";

export function Trade() {
  const [longShort, setLongShort] = React.useState('long');
  const [account, setAccount] = React.useState('');
  const [collateral, setCollateral] = React.useState('');
  const [leverage, setLeverage] = React.useState('');
  const [market, setMarket] = React.useState('ETH');

  const availableCollateral = 0;

  const handleCollateralChange = (e) => {
    setCollateral(e.target.value);
  };

  const handleLeverageChange = (e) => {
    setLeverage(e.target.value);
  };

  const handleAccountChange = (e) => {
    setAccount(e.target.value);
  };

  const handleMarketChange = (e) => {
    setMarket(e.target.value);
  };

  const handleSubmit = () => {
    console.log({ longShort, account, collateral, leverage });
  };

  return (
    <>
      <PerpsUserMenu />
      <Box p={6} border="1px solid" borderColor="gray.700" borderRadius="md">
        <FormControl mb={2}>
        <FormLabel>Market</FormLabel>
        <Select placeholder='Select a market' mb="4" value={market} onChange={handleMarketChange}>
          <option value='ETH'>ETH</option>
        </Select>
        </FormControl>
        <RadioGroup onChange={setLongShort} value={longShort} mb={2}>
          <Stack direction='row'>
            <Radio value='long'>Long</Radio>
            <Radio value='short'>Short</Radio>
          </Stack>
        </RadioGroup>
        <FormControl mb={2}>
          <InputGroup>
            <InputLeftAddon>$</InputLeftAddon>
            <Input type='number' placeholder='0' value={collateral} onChange={handleCollateralChange} />
          </InputGroup>
          <FormHelperText>
            Available: ${availableCollateral.toLocaleString()}
          </FormHelperText>
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Leverage</FormLabel>
          <InputGroup>
            <Input type='number' value={leverage} onChange={handleLeverageChange} />
            <InputRightAddon>&times;</InputRightAddon>
          </InputGroup>
        </FormControl>
        <Button w="100%" onClick={handleSubmit}>Submit</Button>
      </Box>
    </>
  );
}
