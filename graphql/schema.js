const { ApolloServer } = require('@apollo/server');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    user: req.user // User data from authentication middleware
  })
});

module.exports = server;
