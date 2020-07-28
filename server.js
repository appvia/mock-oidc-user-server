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

const host = process.env.ISSUER_HOST || 'localhost';
const prefix = process.env.ISSUER_PREFIX || '/';

const configClient2 = ['CLIENT_ID_2', 'CLIENT_REDIRECT_URI_2', 'CLIENT_LOGOUT_REDIRECT_URI_2', 'CLIENT_SILENT_REDIRECT_URI_2']
  .reduce((acc, v) => {
    acc[camelCase(v)] = process.env[v];
    return acc;
  }, { });

configClient1.redirect_uris = [configClient1.clientRedirectUri,
  configClient1.clientSilentRedirectUri].filter(Boolean);

configClient2.redirect_uris = [configClient2.clientRedirectUri2,
  configClient2.clientSilentRedirectUri2].filter(Boolean);

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
    client_id: configClient2.clientId2 || ' ',
    response_types: ['id_token token'],
    grant_types: ['implicit'],
    redirect_uris: configClient2.redirect_uris,
    token_endpoint_auth_method: 'none',
    post_logout_redirect_uris: [configClient2.clientLogoutRedirectUri2]
  }],
};

const oidc = new Provider(`http://${host}${prefix}`, oidcConfig);

const { invalidate: orig } = oidc.Client.Schema.prototype;

oidc.Client.Schema.prototype.invalidate = function invalidate(message, code) {
  if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') {
    return;
  }

  orig.call(this, message);
};

const app = new Koa();
app.use(mount(prefix, oidc.app));

app.listen(port);
