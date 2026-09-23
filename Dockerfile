FROM node:24-alpine

WORKDIR /app

COPY server.mjs reset.mjs package.json ./
COPY public ./public

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data

RUN mkdir -p /data && chown node:node /data
VOLUME /data
EXPOSE 3000

USER node
CMD ["node", "server.mjs"]
