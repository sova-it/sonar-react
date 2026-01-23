#Base Node.js image: 24 lts slim
FROM node:lts-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=8081
ENV HOST=0.0.0.0
EXPOSE 8081

CMD ["npm", "start"]