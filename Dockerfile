# --------
# Build step
# --------
FROM node:lts-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:web   # Produces dist/ folder

# --------
# NGINX runtime
# --------
FROM nginx:stable-alpine-slim

# Copy built frontend
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config as template (envsubst will process it on startup)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Azure listens on port 80
EXPOSE 80

RUN apk add --no-cache curl

# nginx docker image automatically runs envsubst on /etc/nginx/templates/*.template
# Pass API_HOST as a build arg: --build-arg API_HOST=...
# For GitHub Actions we need: - run: docker build --build-arg API_HOST=${{ secrets.API_HOST }} .
ARG API_HOST=localhost
ENV API_HOST=${API_HOST}

CMD ["nginx", "-g", "daemon off;"]
