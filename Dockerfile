FROM registry.access.redhat.com/ubi9/nodejs-20-minimal:latest

WORKDIR /app

# Install dependencies (only express — no native addons)
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy server and frontend
COPY server/server.js ./server.js
COPY index.html ./index.html

USER 1001
EXPOSE 8080
CMD ["node", "server.js"]
