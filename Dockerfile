# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.16.0

FROM node:${NODE_VERSION}-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies with full permissions for dev environment
RUN npm install

# Copy the rest of the application
COPY . .

# Create Vite temp directory with proper permissions
RUN mkdir -p node_modules/.vite-temp && chmod 777 node_modules/.vite-temp

# Expose Vite's default port
EXPOSE 5173

# Run in development mode, binding to all interfaces
CMD ["npm", "run", "dev", "--", "--host"]