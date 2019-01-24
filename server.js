/* eslint-disable no-console */

const assert = require('assert');
const camelCase = require('camelcase');

const Provider = require('oidc-provider');

const port = process.env.PORT || 3000;

const config = ['CLIENT_ID', 'CLIENT_SECRET', 'CLIENT_REDIRECT_URI'].reduce((acc, v) => {
  assert(process.env[v], `${v} config missing`);
  acc[camelCase(v)] = process.env[v];
  return acc;
}, {});

/* eslint-disable no-unused-vars */
async function findById(ctx, sub, token) {
  // Using the built in dev interactions in node-oidc-provider,
  // we expect `sub` to be an email address here.
  return {
    accountId: sub,
    async claims(use, scope, claims, rejected) {
      const username = sub.split('@')[0];
      return {
        sub,
        email: sub,
        name: username,
        preferred_username: username
      };
    }
  };
}
/* eslint-enable no-unused-vars */

const oidcConfig = {
  features: {
    devInteractions: true,
    discovery: true,
    registration: false,
    revocation: true,
    sessionManagement: false
  },
  formats: {
    default: 'jwt',
    AccessToken: 'jwt',
    RefreshToken: 'jwt'
  },
  claims: {
    email: ['email'],
    profile: ['name', 'preferred_username']
  },
  findById
};

const oidc = new Provider(`http://localhost:${port}`, oidcConfig);

const clients = [
  {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uris: [config.clientRedirectUri]
  }
];

let server;
(async () => {
  await oidc.initialize({ clients });

  server = oidc.listen(port, () => {
    console.log(
      `mock-oidc-user-server listening on port ${port}, check http://localhost:${port}/.well-known/openid-configuration`
    );
  });
})().catch(err => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
