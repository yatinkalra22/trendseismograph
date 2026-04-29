FROM node:20-alpine AS builder
WORKDIR /app
# Pin pnpm to match the workspace's local version (matches packageManager spec).
RUN npm install -g pnpm@10
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @trendseismograph/backend build
# deploy extracts the package and its production dependencies to a standalone folder.
# Requires inject-workspace-packages=true (set in repo-root .npmrc).
RUN pnpm --filter @trendseismograph/backend --prod deploy /pruned

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy only the extracted production-ready package
COPY --from=builder /pruned/dist ./dist
COPY --from=builder /pruned/node_modules ./node_modules
COPY --from=builder /pruned/package.json ./
EXPOSE 3001
USER node
CMD ["node", "dist/main"]
