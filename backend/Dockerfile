FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=app:app package.json package-lock.json ./
COPY --chown=app:app src ./src
USER app
EXPOSE 4000
CMD ["sh", "-c", "node src/db/migrate.js && exec node src/server.js"]
