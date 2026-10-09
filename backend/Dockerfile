FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ build-base

COPY package*.json ./

RUN npm ci --build-from-source argon2

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]