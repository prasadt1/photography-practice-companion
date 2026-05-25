FROM node:22-slim

RUN npm install -g mongodb-mcp-server@latest

COPY services/mongodb-mcp/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
