FROM node:lts-alpine3.13

WORKDIR /app

COPY package.json ./

COPY server/package*.json server/
RUN npm run install-server --only=production

COPY codenames/package*.json codenames/
RUN npm run install-codenames --only=production

COPY codenames/ codenames/
RUN npm run build --prefix codenames

COPY server/ server/

RUN npm run movebuild --prefix codenames

COPY certs/cert.pem server/cert.pem
COPY certs/key.pem server/key.pem

USER node

CMD ["npm","start","--prefix","server"]

EXPOSE 8000