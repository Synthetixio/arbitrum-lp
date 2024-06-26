import { Flex, Heading, Link } from '@chakra-ui/react';
import Head from 'react-helmet';
import { Link as NavLink } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <>
      <Head>
        <title>Not Found</title>
      </Head>
      <Flex
        height="100%"
        direction="column"
        position="relative"
        alignItems="center"
        justifyContent="center"
        flex="1"
      >
        <Heading fontSize="5xl">Not found</Heading>

        <Link as={NavLink} to="/" color="cyan.500">
          Return to Home
        </Link>
      </Flex>
    </>
  );
};
