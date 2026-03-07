# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend ./apps/backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build backend
WORKDIR /app/apps/backend
RUN pnpm build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy from builder
COPY --from=builder /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/backend ./apps/backend

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Expose port
EXPOSE 4000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
