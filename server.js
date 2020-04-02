/* eslint-disable no-console */

const assert = require('assert');
const camelCase = require('camelcase');
const Provider = require('oidc-provider');
const Koa = require('koa');
const mount = require('koa-mount');

const port = process.env.PORT || 3000;

const config = ['CLIENT_ID', 'CLIENT_REDIRECT_URI', 'CLIENT_LOGOUT_REDIRECT_URI'].reduce((acc, v) => {
  assert(process.env[v], `${v} config missing`);
  acc[camelCase(v)] = process.env[v];
  return acc;
}, {});

config.host = process.env.ISSUER_HOST || 'localhost';
config.prefix = process.env.ISSUER_PREFIX || '/';

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

const oidc = new Provider(`http://${config.host}${config.prefix}`, oidcConfig);

const { invalidate: orig } = oidc.Client.Schema.prototype;

oidc.Client.Schema.prototype.invalidate = function invalidate(message, code) {
  if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') {
    return;
  }

  orig.call(this, message);
};

const app = new Koa();
app.use(mount(config.prefix, oidc.app));

app.listen(port);
