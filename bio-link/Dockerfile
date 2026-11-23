FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

RUN mkdir -p /app/data /app/uploads

ENV NODE_ENV=production
ENV PORT=3005

EXPOSE 3005

CMD ["node", "server.js"]
