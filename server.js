/* eslint-disable no-console */

const assert = require('assert');
const camelCase = require('camelcase');

const Provider = require('oidc-provider');

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

const config = ['CLIENT_ID', 'CLIENT_SECRET', 'CLIENT_REDIRECT_URI', 'CLIENT_LOGOUT_REDIRECT_URI'].reduce((acc, v) => {
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

const oidc = new Provider(`http://${host}:${port}`, oidcConfig);

const clients = [
  {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uris: [config.clientRedirectUri],
    post_logout_redirect_uris: [config.clientLogoutRedirectUri]
  }
];

let server;
(async () => {
  await oidc.initialize({ clients });

  server = oidc.listen(port, () => {
    console.log(
      `mock-oidc-user-server listening on port ${port}, check http://${host}:${port}/.well-known/openid-configuration`
    );
  });
})().catch(err => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
