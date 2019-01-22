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

const oidcConfig = {
  features: {
    devInteractions: true,
    discovery: true,
    registration: false,
    revocation: true,
    sessionManagement: false
  },
  format: {
    default: 'jwt',
    AccessToken: 'jwt',
    RefreshToken: 'jwt'
  }
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
