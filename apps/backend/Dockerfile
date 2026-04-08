FROM node:20-alpine AS builder
WORKDIR /app
# Set CI=true to prevent pnpm from failing on TTY/confirmation prompts
ENV CI=true
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @trendseismograph/backend build
RUN pnpm prune --prod --no-optional

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./
EXPOSE 3001
USER node
CMD ["node", "dist/main"]
