FROM node:lts-alpine
WORKDIR /usr/src/app

# install dependencies
COPY package*.json ./
RUN npm install

# copy application
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
