FROM node:10.15-alpine

LABEL maintainer="info@appvia.io"
LABEL source="https://github.com/appvia/mock-oidc-user-server"

WORKDIR /app

# Update packages in base image
RUN apk update && apk upgrade && apk add git

COPY . .

RUN yarn install --force

# User 1000 is already provided in the base image (as 'node')

RUN chown -R node:node /app

USER 1000

CMD [ "yarn", "start" ]
