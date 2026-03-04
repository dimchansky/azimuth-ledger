# Stage 1: deps — install node_modules
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: test — run unit tests
FROM deps AS test
COPY . .
RUN npm test

# Stage 3: build — produce /app/dist
FROM deps AS build
COPY . .
RUN npm run build

# Stage 4: serve for local preview
FROM nginx:alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html/azimuth-ledger
