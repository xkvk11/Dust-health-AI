# Step 1: React 빌드
# FROM node:23 AS build
# WORKDIR /app
# COPY ./src/ /app/src/
# COPY ./public/ /app/public/
# COPY ./package.json /app/package.json
# # RUN npm install
# # COPY . /app/
# ENTRYPOINT [ "npm","install" ]
# # RUN npm run build
# CMD [ "npm","start" ]

# Step 2: 빌드된 React 앱을 Nginx를 통해 제공
FROM nginx:alpine-slim

COPY ./build/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
