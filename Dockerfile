FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json index.html game.html ./
COPY scripts ./scripts
COPY styles ./styles
COPY assets ./assets
COPY server ./server
ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/data/feed-days.sqlite
EXPOSE 8080
CMD ["node","server/server.cjs"]
