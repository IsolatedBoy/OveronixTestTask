FROM node:14.15.4

WORKDIR /usr/src/crypto-wallets
COPY package*.json ./

RUN npm install
COPY . .
EXPOSE 3000
CMD [ "node", "app.js" ]
