FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN apk add --no-cache openssl libc6-compat \
    && addgroup -S linkforge && adduser -S linkforge -G linkforge -u 1001 \
    && chown -R linkforge:linkforge /app
USER linkforge
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]