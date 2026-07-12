# Stage 1 (Builder)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files and build the app
COPY . .
RUN npm run build

# Stage 2 (Runner)
FROM node:20-alpine AS runner

WORKDIR /app

# Copy the built output from the builder stage
COPY --from=builder /app/.output /app/.output

# Expose the port
EXPOSE 3000

# Set environment variables for the host and port
ENV PORT=3000
ENV HOST=0.0.0.0

# Set the start command
CMD ["node", ".output/server/index.mjs"]
