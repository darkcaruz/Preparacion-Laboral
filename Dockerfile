FROM node:24-alpine
WORKDIR /app
COPY backend/package.json ./backend/
RUN cd backend && npm install --omit=dev
COPY backend ./backend
COPY index.html styles.css ./
COPY src ./src
USER node
EXPOSE 3000
CMD ["node","backend/server.js"]
