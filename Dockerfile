FROM node:lts-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build static files for production
RUN npm run build:web

# Install serve to host the static files
RUN npm install -g serve

# Azure requires port 80
EXPOSE 80

# Serve the pre-built static files
CMD ["serve", "-s", "dist", "-l", "80"]
