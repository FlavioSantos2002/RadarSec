FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3333
EXPOSE 5555

CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/index.ts"]
