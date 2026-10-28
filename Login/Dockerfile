FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose the port from .env or default to 4000
EXPOSE 4000

CMD ["npm", "start"]
