FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable

# workspace manifests
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts ./apps/web/

# install deps
RUN pnpm install

# copy source
COPY apps/web ./apps/web

# build next
RUN pnpm --filter web build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Next standalone output contains server.js at root
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
