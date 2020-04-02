/* eslint-disable no-console */

const assert = require('assert');
const camelCase = require('camelcase');

const Provider = require('oidc-provider');

const port = process.env.PORT || 3000;

const config = ['CLIENT_ID', 'CLIENT_REDIRECT_URI', 'CLIENT_LOGOUT_REDIRECT_URI'].reduce((acc, v) => {
  assert(process.env[v], `${v} config missing`);
  acc[camelCase(v)] = process.env[v];
  return acc;
}, {});

const oidcConfig = {
  async findAccount(ctx, id) {
    return {
      accountId: id,
      async claims() { return { sub: id, name: id }; },
    };
  },
  claims: {
    openid: [
      'sub', 'name'
    ],
  },
  responseTypes: ['id_token token'],
  clients: [{
    client_id: config.clientId,
    response_types: ['id_token token'],
    grant_types: ['implicit'],
    redirect_uris: [config.clientRedirectUri],
    token_endpoint_auth_method: 'none',
    post_logout_redirect_uris: [config.clientLogoutRedirectUri]
  }],
};

const oidc = new Provider(`http://localhost:${port}`, oidcConfig);

const { invalidate: orig } = oidc.Client.Schema.prototype;

oidc.Client.Schema.prototype.invalidate = function invalidate(message, code) {
  if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') {
    return;
  }

  orig.call(this, message);
};

oidc.listen(port, () => {
  console.log(`mock-oidc-user-server listening on port ${port}, check http://localhost:${port}/.well-known/openid-configuration`);
});
