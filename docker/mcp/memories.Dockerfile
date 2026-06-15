FROM node:22-slim

RUN npm install -g @memories.sh/cli

ENV HOME=/data
WORKDIR /data

CMD ["memories", "serve"]
