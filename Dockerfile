FROM node:22-alpine

WORKDIR /app

# Instalar dependencias para Sharp y otras librerías
RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev giflib-dev

COPY package*.json ./

RUN npm ci

COPY . .

RUN mkdir -p src/uploads && chmod 777 src/uploads

EXPOSE 8000

ENV NODE_ENV=production

CMD ["npm", "start"]
