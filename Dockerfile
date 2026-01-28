# Stage 1: Build Expo Web App
FROM node:lts-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Build Expo web version
RUN npm run build:web


# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy Expo web build output into Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Azure requires port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
