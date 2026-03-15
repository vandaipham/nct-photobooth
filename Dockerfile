FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including express and nodemailer)
RUN npm install

# Copy all files
COPY . .

# Build the React frontend into the /dist folder
RUN npm run build

# Expose port 8080
EXPOSE 8080

# Run the Node.js backend server
CMD ["node", "server.js"]