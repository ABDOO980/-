# سَكينة — one image serving the web app and the API (Railway / any Docker host).
FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY . .
# devDependencies (vite, esbuild) are needed to build, so install in dev mode.
RUN NODE_ENV=development pnpm install --frozen-lockfile=false
RUN PORT=3000 BASE_PATH=/ pnpm --filter @workspace/sakeena-pwa build
RUN pnpm --filter @workspace/api-server build
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@workspace/api-server", "start"]
