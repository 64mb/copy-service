FROM node:14.17.3-alpine3.14

RUN apk add --no-cache openssh-client git

RUN mkdir -p /home/node/app

RUN npm i -g nodemon

WORKDIR /home/node/app

CMD [ "node", "./docker/docker_entry.js" ]
