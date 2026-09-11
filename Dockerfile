# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Fangoo web
#
# Nuxt's `.output` is self-contained: it bundles the server and its runtime
# dependencies, so the final image needs no node_modules at all.
# ---------------------------------------------------------------------------

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Baked into the client bundle at build time, so they must be present here and
# not only at run time. The server re-reads them at boot and refuses to start if
# they still point at localhost — see server/plugins/validate-runtime-config.ts.
ARG NUXT_PUBLIC_API_BASE
ARG NUXT_PUBLIC_SITE_URL
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_SITE_URL=$NUXT_PUBLIC_SITE_URL

RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

USER node

COPY --from=build --chown=node:node /app/.output ./.output

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Exec form so the server is PID 1 and gets SIGTERM directly.
CMD ["node", ".output/server/index.mjs"]
