FROM node:25-alpine
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci --legacy-peer-deps
COPY . /app
CMD npm run serve
EXPOSE 8080
