#kompilacja argon2
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++ build-base
COPY package*.json ./
RUN npm ci --build-from-source argon2

#Obraz produkcyjny
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "src/app.js"]