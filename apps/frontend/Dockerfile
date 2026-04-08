FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
ENV NEXT_PUBLIC_API_URL=http://localhost:3001
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @trendseismograph/frontend build
# For Next.js standalone, we actually want the full workspace for the build,
# but the 'standalone' output will be what we use in the runner.
# pnpm deploy is less useful for Next.js standalone because Next.js handles its own pruning.

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Next.js standalone output includes everything needed to run the app
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
EXPOSE 3000
USER node
CMD ["node", "apps/frontend/server.js"]
