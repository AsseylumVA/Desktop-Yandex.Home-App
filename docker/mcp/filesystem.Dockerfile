FROM node:22-slim

WORKDIR /projects

ENTRYPOINT ["npx", "-y", "@modelcontextprotocol/server-filesystem"]
