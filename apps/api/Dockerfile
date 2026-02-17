FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/

# Install workspace deps (needed to build)
RUN pnpm install

# Copy sources and build
COPY apps/api/src ./apps/api/src
RUN pnpm --filter api build

# Create isolated production bundle for api (includes prod node_modules)
RUN pnpm --filter api deploy --prod /out


FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# /out already contains: package.json, dist, node_modules
COPY --from=build /out/ ./

EXPOSE 4000
CMD ["node", "dist/server.js"]
