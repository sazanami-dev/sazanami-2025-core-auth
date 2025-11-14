FROM node:22

WORKDIR /app

COPY package*.json ./

COPY ./frontend/package*.json ./frontend/

COPY ./src/routes/manage/frontend/package*.json ./src/routes/manage/frontend/

RUN npm run install:full

COPY . .

EXPOSE 3000

RUN npm run db:generate

RUN npm run build

RUN npm run db:push

CMD ["npm", "run", "db:push", "&&", "npm", "start"]
