# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the project files
COPY . .

# Expose NestJS port
EXPOSE 3000

# Run NestJS in dev mode (with hot reload)
CMD ["npm", "run", "start:dev"]
