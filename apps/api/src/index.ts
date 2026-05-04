import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';

const port = Number(process.env.PORT) || 4000;

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, { listen: { port } });

console.log(`API ready at ${url}`);
