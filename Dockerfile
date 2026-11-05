FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libreoffice-calc \
    libreoffice-writer \
    fonts-liberation \
    fonts-noto-core \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./

EXPOSE 5000
CMD ["npm", "start"]
