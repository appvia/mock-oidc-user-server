# mock-oidc-user-server

Forked from https://github.com/appvia/mock-oidc-user-server

| WARNING: DO NOT USE IN PRODUCTION |
| --------------------------------- |


A mock user server providing OpenID Connect (OIDC) flows for development and testing.

Uses the excellent [node-oidc-provider](https://github.com/panva/node-oidc-provider), which comes with dev interactions/flows out of the box (OIDC compliant). Any username and password combination is permitted for logging in, making this very useful for development and CI.

Using implicit grant flow with "id_token token" request type, and returns a {sub:id, name:id} in the id_token and user_info endpoints.

## Usage

Example usage via Docker Compose:

```yaml
version: '3.7'
services:
  mock_user_service:
    image: gridsuite/gridsuite-oidc-mock-server:v0.0.1
    environment:
      - PORT=9090
      - CLIENT_ID=my-client
      - CLIENT_REDIRECT_URI=http://localhost:8080/cb
      - CLIENT_LOGOUT_REDIRECT_URI=http://localhost:8080
    ports:
      - 9090:9090
```

Behind a reverse proxy at http://myhost/myprefix/.well-known/openid-configuration
```yaml
      - HOST=myhost
      - prefix=/myprefix
```

To add a second redirect_uri, useful for silent renews, use:
```yaml
      - CLIENT_SILENT_REDIRECT_URI=http://localhost:8080/renewcb
```

To add a second client (optional) use:
```yaml
      - CLIENT_ID_2=my-client_2
      - CLIENT_REDIRECT_URI_2=http://localhost:8081/cb
      - CLIENT_LOGOUT_REDIRECT_URI_2=http://localhost:8081
      - CLIENT_SILENT_REDIRECT_URI_2=http://localhost:8081/renewcb
```

## Dev

Prerequisites:

- NodeJS (v10.15.0+)
- npm

To install dependencies:

```shell
npm install
```

To build the Docker image locally:

```shell
docker build -t gridsuite-oidc-mock-server .
```
