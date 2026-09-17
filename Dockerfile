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
# `--ignore-scripts` is required, not an optimisation: the postinstall hook runs
# `nuxt prepare`, and at this point only the manifests have been copied — there
# is no nuxt.config.ts or app/ for it to prepare. `nuxt build` runs the same
# preparation itself once the source is present in the next stage.
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NUXT_PUBLIC_API_BASE and NUXT_PUBLIC_SITE_URL are deliberately absent here.
# Nuxt resolves public runtime config when the server starts and ships it to the
# browser in the page payload, so one image serves any environment. They are
# supplied at run time, and the server refuses to start without valid values —
# see server/plugins/validate-runtime-config.ts.
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
