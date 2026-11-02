FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/extension/package.json apps/extension/package.json
COPY apps/catalogue/package.json apps/catalogue/package.json
RUN npm ci
COPY apps ./apps
COPY fixtures ./fixtures
RUN npm run build -w @streamcart/api && npm prune --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/fixtures ./fixtures
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:8787/health >/dev/null || exit 1
CMD ["npm","run","start","-w","@streamcart/api"]
