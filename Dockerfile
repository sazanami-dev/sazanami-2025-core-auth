FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

RUN npm run db:generate

RUN npm run build

CMD ["npm", "start"]
