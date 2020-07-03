/* eslint-disable no-console */

const assert = require('assert');
const camelCase = require('camelcase');
const Provider = require('oidc-provider');
const Koa = require('koa');
const mount = require('koa-mount');

const port = process.env.PORT || 3000;

const configClient1 = ['CLIENT_ID', 'CLIENT_REDIRECT_URI', 'CLIENT_LOGOUT_REDIRECT_URI'].reduce((acc, v) => {
  assert(process.env[v], `${v} config missing`);
  acc[camelCase(v)] = process.env[v];
  return acc;
}, {});

if (process.env.CLIENT_SILENT_REDIRECT_URI) {
  configClient1.clientSilentRedirectUri = process.env.CLIENT_SILENT_REDIRECT_URI;
}

const configClient2 = ['CLIENT_ID_2', 'CLIENT_REDIRECT_URI_2', 'CLIENT_LOGOUT_REDIRECT_URI_2', 'CLIENT_SILENT_REDIRECT_URI_2'].reduce((acc, v) => {
  //Optional Client
  acc[camelCase(v)] = process.env[v];
  return acc;
}, {});

configClient1.host = process.env.ISSUER_HOST || 'localhost';
configClient1.prefix = process.env.ISSUER_PREFIX || '/';

configClient1.redirect_uris = [configClient1.clientRedirectUri, configClient1.clientSilentRedirectUri].filter(Boolean);
configClient2.redirect_uris = [configClient2.clientRedirectUri, configClient2.clientSilentRedirectUri].filter(Boolean);

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
    client_id: configClient1.clientId,
    response_types: ['id_token token'],
    grant_types: ['implicit'],
    redirect_uris: configClient1.redirect_uris,
    token_endpoint_auth_method: 'none',
    post_logout_redirect_uris: [configClient1.clientLogoutRedirectUri]
  }, {
    client_id: configClient2.clientId,
    response_types: ['id_token token'],
    grant_types: ['implicit'],
    redirect_uris: configClient2.redirect_uris,
    token_endpoint_auth_method: 'none',
    post_logout_redirect_uris: [configClient2.clientLogoutRedirectUri]
  }],
};

const oidc = new Provider(`http://${configClient1.host}${configClient1.prefix}`, oidcConfig);

const { invalidate: orig } = oidc.Client.Schema.prototype;

oidc.Client.Schema.prototype.invalidate = function invalidate(message, code) {
  if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') {
    return;
  }

  orig.call(this, message);
};

const app = new Koa();
app.use(mount(configClient1.prefix, oidc.app));

app.listen(port);
