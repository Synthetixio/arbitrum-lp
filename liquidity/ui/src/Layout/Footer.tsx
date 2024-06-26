import { Container, Flex, Link } from '@chakra-ui/react';
import { DiscordIcon } from './DiscordIcon';
import { GithubIcon } from './GithubIcon';
import { Logo } from './Logo';
import { WarpcastIcon } from './WarpcastIcon';
import { XIcon } from './XIcon';
import { YoutubeIcon } from './YoutubeIcon';

export const Footer = () => {
  return (
    <Flex borderTop="1px solid" borderTopColor="gray.900" bg="navy.700">
      <Container
        maxW="1236px"
        as={Flex}
        height="72px"
        alignItems="center"
        justifyContent="space-between"
      >
        <Logo withText={false} />
        <Flex alignItems="center">
          <Link href="https://discord.com/invite/synthetix" target="_blank">
            <DiscordIcon w="24px" h="24px" mr={2} />
          </Link>
          <Link href="https://x.com/synthetix_io" target="_blank">
            <XIcon w="24px" h="24px" mr={2} />
          </Link>
          <Link href="https://github.com/Synthetixio/" target="_blank">
            <GithubIcon w="24px" h="24px" mr={2} />
          </Link>
          <Link href="https://warpcast.com/~/channel/synthetix" target="_blank">
            <WarpcastIcon w="24px" h="24px" mr={2} />
          </Link>
          <Link href="https://www.youtube.com/@synthetix.v3" target="_blank">
            <YoutubeIcon w="24px" h="24px" />
          </Link>
        </Flex>
      </Container>
    </Flex>
  );
};
