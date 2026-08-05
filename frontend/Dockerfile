FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY . .
ARG VITE_API_URL=http://localhost:5007
ENV VITE_API_URL=$VITE_API_URL
ENV HUSKY=0
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/index.html ./index.html

EXPOSE 5173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
