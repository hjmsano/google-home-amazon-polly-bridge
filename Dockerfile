FROM node:10-alpine

RUN mkdir /var/app
WORKDIR /var/app
ADD . /var/app

RUN npm install
CMD npm start