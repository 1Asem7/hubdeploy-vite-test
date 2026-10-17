FROM node:22.23.3-alpine3.24

WORKDIR /app

# Dependencies first, so a change to server.js keeps this layer cached.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./

# Never root at runtime.
USER node

EXPOSE 3000
CMD ["node", "server.js"]
