FROM node:14.17.3-alpine3.14

RUN apk add --no-cache openssh-client git

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node

WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci --only=production

COPY --chown=node:node . .

CMD [ "node", "server.js" ]
