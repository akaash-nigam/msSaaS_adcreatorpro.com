FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 8080

# Set environment
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"]
