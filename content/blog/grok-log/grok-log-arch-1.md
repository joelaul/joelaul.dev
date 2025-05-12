---
author: 'Joe Lauletta'
date: 2025-05-10
title: 'grok-log-arch-1'
tags: ['tech']

# draft: true
---

## As I studied an open-source codebase with intent to contribute, I used [ChatGPT](https://chatgpt.com) as a note-taking tool. This is my side of one of our conversations.

---

can you explain the reasoning for how linters, formatters, and other dependencies are distributed across the following three package.json files? not sure why eslint appears in both root and frontend. also, do the dependencies / devDependencies here abide by the sorting system we've discussed before?

root:

```
{ 
"name": "codebase",
"version": "0.1.0",
"repository": "git@github.com:jaredjj3/code-base.git",
"private": true,
"scripts": {
    "test:api": "cd api && yarn test",
    "test:web": "cd web && yarn test",
    "dev:web": "cd web && yarn start",
    "dev:api": "cd api && yarn dev:api",
    "dev:worker": "cd api && yarn dev:worker",
    "dev:dispatcher": "cd api && yarn dev:dispatcher",
    "migrate": "cd api && yarn migrate",
    "seed": "cd api && yarn seed",
    "prod:api": "cd api && yarn prod:api",
    "prod:worker": "cd api && yarn prod:worker",
    "prod:dispatcher": "cd api && yarn prod:dispatcher"
},
"devDependencies": {
    "@types/node": "^14.14.30",
    "@types/node-cleanup": "^2.1.1",
    "@typescript-eslint/eslint-plugin": "5.30.4",
    "@typescript-eslint/parser": "5.30.4",
    "babel-eslint": "10.x",
    "chalk": "^4.1.0",
    "eslint": "^7.11.0",
    "eslint-config-prettier": "^6.13.0",
    "eslint-config-react-app": "^5.1.0",
    "eslint-loader": "^4.0.2",
    "eslint-plugin-flowtype": "3.13.0",
    "eslint-plugin-import": "^2.20.2",
    "eslint-plugin-jest-dom": "^1.3.0",
    "eslint-plugin-jsx-a11y": "6.2.3",
    "eslint-plugin-prettier": "^3.1.1",
    "eslint-plugin-react": "7.16.0",
    "eslint-plugin-react-hooks": "^1.6.1",
    "eslint-plugin-testing-library": "^1.3.4",
    "execa": "^5.1.1",
    "gulp": "^4.0.2",
    "node-cleanup": "^2.1.2",
    "prettier": "2.7.1",
    "prettier-plugin-organize-imports": "^1.1.1",
    "ts-node": "^10.0.0",
    "typescript": "^4.1.5"
},
"dependencies": {
    "@types/uuid": "^8.3.1"
}
}
```

frontend:

```
{
"name": "web",
"version": "1.4.3",
"private": true,
"dependencies": {
    "@ant-design/icons": "4.5.0",
    "@craco/craco": "6.4.1",
    "@graphql-codegen/cli": "1.21.2",
    "@graphql-codegen/typescript": "1.21.1",
    "@moonwave99/fretboard.js": "0.2.7",
    "@reduxjs/toolkit": "1.5.0",
    "@codebase/musicxml": "0.2.6",
    "@testing-library/dom": "8.13.0",
    "@testing-library/jest-dom": "5.16.4",
    "@testing-library/react": "13.3.0",
    "@testing-library/user-event": "14.2.0",
    "@tonaljs/tonal": "4.6.5",
    "@types/extract-files": "8.1.0",
    "@types/graphql": "14.5.0",
    "@types/jest": "26.0.20",
    "@types/jest-when": "2.7.2",
    "@types/jquery": "3.5.6",
    "@types/lodash": "4.14.168",
    "@types/node": "12.0.0",
    "@types/react": "18.0.9",
    "@types/react-dom": "18.0.4",
    "@types/react-router-dom": "5.3.3",
    "@types/react-scroll": "1.8.2",
    "@types/react-transition-group": "4.4.1",
    "@types/styled-components": "5.1.25",
    "@types/uuid": "8.3.1",
    "@types/video.js": "7.3.15",
    "@xstate/react": "1.5.1",
    "antd": "4.22.4",
    "babel-eslint": "10.1.0",
    "babel-plugin-import": "1.13.3",
    "craco-less": "1.17.1",
    "css-loader": "5.1.1",
    "customize-cra": "1.0.0",
    "dayjs": "1.10.4",
    "detect-it": "4.0.1",
    "extract-files": "9.0.0",
    "fast-deep-equal": "3.1.3",
    "graphql": "15.5.0",
    "intersection-observer": "0.12.0",
    "jest-environment-jsdom-sixteen": "1.0.3",
    "jest-extended": "0.11.5",
    "jest-junit": "12.0.0",
    "jest-when": "3.2.1",
    "jquery": "3.6.0",
    "lodash": "4.17.21",
    "opensheetmusicdisplay": "1.5.4",
    "react": "18.1.0",
    "react-dom": "18.1.0",
    "react-is": "17.0.1",
    "react-router-dom": "6.3.0",
    "react-scripts": "4.0.3",
    "react-scroll": "1.8.1",
    "react-snap": "1.23.0",
    "resize-observer-polyfill": "1.5.1",
    "styled-components": "5.3.5",
    "ts-toolbelt": "9.6.0",
    "typed-graphqlify": "3.1.4",
    "typescript": "4.7.4",
    "uuid": "8.3.1",
    "video.js": "7.14.3",
    "videojs-contrib-quality-levels": "^2.1.0",
    "web-vitals": "1.0.1",
    "workbox-background-sync": "5.1.3",
    "workbox-broadcast-update": "5.1.3",
    "workbox-cacheable-response": "5.1.3",
    "workbox-core": "5.1.3",
    "workbox-expiration": "5.1.3",
    "workbox-google-analytics": "5.1.3",
    "workbox-navigation-preload": "5.1.3",
    "workbox-precaching": "5.1.3",
    "workbox-range-requests": "5.1.3",
    "workbox-routing": "5.1.3",
    "workbox-strategies": "5.1.3",
    "workbox-streams": "5.1.3",
    "xstate": "4.23.1"
},
"scripts": {
    "start": "craco start",
    "build": "craco build",
    "postbuild": "react-snap",
    "test": "craco test",
    "eject": "craco eject",
    "typegen": "graphql-codegen"
},
"eslintConfig": {
    "extends": [
    "react-app",
    "react-app/jest"
    ]
},
"browserslist": {
    "production": [
    ">0.2%",
    "not dead",
    "not op_mini all"
    ],
    "development": [
    "last 1 chrome version",
    "last 1 firefox version",
    "last 1 safari version"
    ]
},
"jest-junit": {
    "suiteName": "web",
    "outputName": "junit.web.xml",
    "outputDirectory": "./reports",
    "suiteNameTemplate": "{displayName}",
    "classNameTemplate": "{classname}"
},
"jest": {
    "transformIgnorePatterns": [
    "/node_modules/(?!antd|@ant-design|rc-.+?|@babel/runtime).+(js|jsx)$"
    ]
},
"reactSnap": {
    "puppeteerArgs": [
    "--no-sandbox",
    "--disable-setuid-sandbox"
    ]
}
}
```

backend:

```
{
"name": "api",
"version": "1.4.3",
"description": "GraphQL server for @codebase",
"license": "MIT",
"private": true,
"scripts": {
    "migrate": "yarn mikro-orm migration:up",
    "seed": "yarn ts-node src/db/mikro-orm/seeds/seed.ts",
    "dev:api": "yarn ts-node-dev --transpile-only src/entrypoints/api.ts",
    "dev:worker": "yarn ts-node-dev --transpile-only src/entrypoints/worker.ts",
    "dev:dispatcher": "yarn ts-node-dev --transpile-only src/entrypoints/dispatcher.ts",
    "prod:api": "node build/entrypoints/api.js",
    "prod:worker": "node build/entrypoints/worker.js",
    "prod:dispatcher": "node build/entrypoints/dispatcher.js",
    "pretest": "yarn migrate",
    "test": "yarn jest --maxWorkers=$JEST_NUM_WORKERS",
    "typegen": "graphql-codegen"
},
"dependencies": {
    "@mikro-orm/core": "^4.5.7",
    "@mikro-orm/postgresql": "^4.5.7",
    "altair-express-middleware": "^3.2.1",
    "aws-sdk": "^2.844.0",
    "bcrypt": "^5.0.0",
    "bullmq": "1.89.1",
    "class-validator": "^0.13.1",
    "cls-hooked": "^4.2.2",
    "connect-redis": "^5.1.0",
    "cors": "^2.8.5",
    "dataloader": "^2.0.0",
    "execa": "^5.1.1",
    "express": "^4.17.1",
    "express-graphql": "^0.12.0",
    "express-session": "^1.17.1",
    "extract": "^1.0.0",
    "files": "^2.1.1",
    "graphql": "^15.5.0",
    "graphql-upload": "^11.0.0",
    "inversify": "^5.0.5",
    "knex": "^0.21.17",
    "lodash": "^4.17.21",
    "morgan": "^1.10.0",
    "nodemailer": "^6.4.18",
    "pg": "^8.5.1",
    "redis": "^3.1.1",
    "reflect-metadata": "^0.1.13",
    "type-graphql": "1.1.1",
    "uuid": "^8.3.2",
    "winston": "^3.3.3"
},
"devDependencies": {
    "@aws-cdk/aws-cloudfront": "^1.113.0",
    "@graphql-codegen/cli": "^1.20.1",
    "@graphql-codegen/typescript": "^1.21.0",
    "@mikro-orm/cli": "^4.5.7",
    "@types/aws-sdk": "^2.7.0",
    "@types/bcrypt": "^3.0.0",
    "@types/bluebird": "^3.5.33",
    "@types/cls-hooked": "^4.3.3",
    "@types/connect-redis": "^0.0.16",
    "@types/cors": "^2.8.10",
    "@types/express": "^4.17.11",
    "@types/express-graphql": "^0.9.0",
    "@types/express-session": "^1.17.3",
    "@types/extract-files": "^8.1.0",
    "@types/graphql": "^14.5.0",
    "@types/graphql-upload": "^8.0.4",
    "@types/inversify": "^2.0.33",
    "@types/jest": "^26.0.20",
    "@types/knex": "^0.16.1",
    "@types/lodash": "^4.14.168",
    "@types/morgan": "^1.9.2",
    "@types/node": "^14.14.28",
    "@types/nodemailer": "^6.4.0",
    "@types/redis": "^2.8.28",
    "@types/supertest": "^2.0.10",
    "@types/uuid": "^8.3.0",
    "@types/validator": "^13.1.3",
    "@types/winston": "^2.4.4",
    "jest": "^27.0.6",
    "jest-circus": "^27.0.6",
    "jest-extended": "^0.11.5",
    "jest-junit": "^12.0.0",
    "jest-watch-typeahead": "^0.6.1",
    "supertest": "^6.1.3",
    "ts-jest": "^27.0.4",
    "ts-node": "^10.2.0",
    "ts-node-dev": "^1.1.6",
    "typescript": "^4.1.5"
},
"jest-junit": {
    "suiteName": "api",
    "outputName": "junit.api.xml",
    "outputDirectory": "./reports",
    "suiteNameTemplate": "{displayName}",
    "classNameTemplate": "{classname}"
},
"mikro-orm": {
    "useTsNode": true,
    "configPaths": [
    "./src/db/mikro-orm/mikro-orm.config.ts"
    ]
}
}
```

---

high-level rundown of the project directory. i assume ./aws is used to orchestrate database and file storage.. as well as deployment? and ./nginx is for the server meant to be used in production? but i see that docker-compose.yml sources nginx config from ./nginx, but nothing about aws. is this because on the production server, the API is run in a container, but connects to AWS architecture outside of it?

```
.
|-- api
|   |-- src
|   |   |-- config
|   |   |-- db
|   |   |-- domain
|   |   |-- entrypoints
|   |   |-- errors
|   |   |-- jobs
|   |   |-- repos
|   |   |-- resolvers
|   |   |-- server
|   |   |-- services
|   |   |-- testing
|   |   |-- util
|   |   |-- inversify.config.ts
|   |   -- inversify.constants.ts
|   |-- codegen.yml
|   |-- jest.config.js
|   |-- package.json
|   |-- tsconfig.json
|   |-- tsconfig.prod.json
|   -- yarn.lock
|-- aws
|   |-- bin
|   |   -- aws.ts
|   |-- lib
|   |   |-- constructs
|   |   |-- CodebaseDevStack.ts
|   |   -- CodebaseStack.ts
|   |-- scripts
|   |   -- config.sh
|   |-- templates
|   |   -- vod.yml
|   |-- test
|   |   -- aws.test.ts
|   |-- README.md
|   |-- cdk.json
|   |-- jest.config.js
|   |-- package.json
|   |-- tsconfig.json
|   -- yarn.lock
|-- bin
|   -- ss
|-- e2e
|   |-- src
|   |   |-- util
|   |   |-- landing.test.ts
|   |   |-- library.test.ts
|   |   |-- login.test.ts
|   |   -- signup.test.ts
|   |-- Dockerfile
|   |-- PuppeteerEnvironment.js
|   |-- jest.config.js
|   |-- jest.setup.js
|   |-- package.json
|   |-- setup.js
|   |-- teardown.js
|   |-- tsconfig.json
|   -- yarn.lock
|-- env
|   |-- api.test.env
|   |-- dev.env
|   |-- fakeprod.env
|   -- web.test.env
|-- nginx
|   |-- nginx.conf
|   |-- nginx.dev.conf
|   -- nginx.fakeprod.conf
|-- scripts
|   |-- Env.ts
|   |-- aws.ts
|   |-- cleanup.ts
|   |-- constants.ts
|   |-- db.ts
|   |-- docker.ts
|   |-- graphql.ts
|   |-- test.ts
|   |-- types.ts
|   -- util.ts
|-- templates
|   -- secrets.template.env
|-- web
|   |-- public
|   |   |-- static
|   |   |-- favicon.ico
|   |   |-- index.html
|   |   |-- logo192.png
|   |   |-- logo384.png
|   |   |-- logo512.png
|   |   |-- manifest.json
|   |   -- robots.txt
|   |-- src
|   |   |-- assets
|   |   |-- components
|   |   |-- ctx
|   |   |-- domain
|   |   |-- hocs
|   |   |-- hooks
|   |   |-- lib
|   |   |-- testing
|   |   |-- util
|   |   |-- App.less
|   |   |-- App.test.tsx
|   |   |-- App.tsx
|   |   |-- config.ts
|   |   |-- constants.ts
|   |   |-- index.tsx
|   |   |-- jest.d.ts
|   |   |-- react-app-env.d.ts
|   |   |-- reportWebVitals.ts
|   |   |-- service-worker.ts
|   |   |-- serviceWorkerRegistration.ts
|   |   |-- setupTests.ts
|   |   -- theme.js
|   |-- README.md
|   |-- codegen.yml
|   |-- craco.config.js
|   |-- package.json
|   |-- tsconfig.json
|   -- yarn.lock
|-- Dockerfile
|-- Dockerfile.nginx
|-- LICENSE
|-- README.md
|-- SECURITY.md
|-- docker-compose.api.test.yml
|-- docker-compose.dev.yml
|-- docker-compose.migrator.yml
|-- docker-compose.web.test.yml
|-- docker-compose.yml
|-- gulpfile.ts
|-- package.json
|-- tree.txt
-- yarn.lock

42 directories, 92 files
```

---

so the nginx reverse proxy, like the aws services, runs outside of the API container? and it's used as a security layer?

---

is Render's nginx server also a reverse proxy that directs requests to your node server that runs on the instance? IWO, are the architectural choices in this codebase made in a Render deployment context, but abstracted from the developer? Also, I've used mongodb atlas in production, i.e., the database is in the cloud, not local to the instance. Is there an analogous cloud postgres database that doesn't require navigating AWS?

---

still not clocking exactly why docker-compose.yml references the nginx RP but not AWS services. here's the content:

```
version: '3.7'

services:
db:
    container_name: db
    image: postgres:11
    restart: always
    environment:
    POSTGRES_DB: codebase
    POSTGRES_USER: codebase
    POSTGRES_PASSWORD: codebase
    ports:
    - 5432:5432

redis:
    container_name: redis
    image: redis:5.0

nginx:
    container_name: nginx
    image: codebasenginx:latest
    volumes:
    - ./nginx/nginx.fakeprod.conf:/etc/nginx/nginx.conf
    links:
    - api
    ports:
    - 80:80

migrate:
    container_name: migrate
    image: codebase:latest
    build:
    context: .
    env_file:
    - ./env/fakeprod.env
    - ./env/secrets.env
    links:
    - db
    command: 'bash -c "cd api && yarn migrate && yarn seed"'

api:
    container_name: api
    image: codebase:latest
    env_file:
    - ./env/fakeprod.env
    - ./env/secrets.env
    links:
    - db
    - redis
    command: ['node', '/app/api/build/entrypoints/api.js']

worker:
    container_name: worker
    image: codebase:latest
    build:
    context: .
    env_file:
    - ./env/fakeprod.env
    - ./env/secrets.env
    environment:
    NODE_ENV: production
    PORT: 3000
    links:
    - db
    - redis
    ports:
    - 3000:3000
    command: ['node', '/app/api/build/entrypoints/worker.js']

dispatcher:
    container_name: dispatcher
    image: codebase:latest
    build:
    context: .
    env_file:
    - ./env/fakeprod.env
    - ./env/secrets.env
    environment:
    NODE_ENV: production
    PORT: 3001
    links:
    - db
    - redis
    ports:
    - 3001:3001
    command: ['node', '/app/api/build/entrypoints/dispatcher.js']
```

---

it seems from the project readme that docker is used to build the app locally too. so in all environments, the react frontend and express api, and the other services in docker-compose.yml are all run in a series of containers? 

---

why isn't the frontend run as a container? 

---

There are two dockerfiles, one just called dockerfile:

```
FROM node:16.0.0

# Includes ffprobe
RUN apt-get update && apt-get -y install ffmpeg

WORKDIR /app

# make ss commands work
COPY ./package.json .
COPY ./yarn.lock .
RUN yarn
COPY ./bin bin
COPY ./scripts scripts
COPY ./gulpfile.ts .
ENV PATH="/app/bin:${PATH}"

# install api dependencies
COPY ./api/package.json api/
COPY ./api/yarn.lock api/
RUN ss installapi

# install web dependencies
COPY ./web/package.json web/
COPY ./web/yarn.lock web/
RUN ss installweb

# copy the web files over
COPY ./web/tsconfig.json web/
COPY ./web/craco.config.js web/
COPY ./web/.env web/

# copy the api files over
COPY ./api/tsconfig.json api/
COPY ./api/tsconfig.prod.json api/
COPY ./api/jest.config.js api/
COPY ./api/src api/src/

# build the api project
RUN yarn tsc --project api/tsconfig.prod.json

# run the project

CMD ["node", "yarn prod:api"]
```

and one called dockerfile.nginx:

```
FROM nginx:1.21

WORKDIR /www/data
COPY ./web/build/ /www/data/
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
```

---

I can see that Dockerfile.nginx bundles the frontend build into the nginx container, just not sure why that step requires a separate file. Also realizing the root level package.json provides gulp, which seems to be a tool that allows build/teardown/etc logic written in javascript (for which scripts/ may contain module code) to be triggered in the terminal as "./bin/ss [command] [args]".

---

"Copies the contents of ./web/build (which must have already been built)"

Yes, at that point in the pipeline, ./web/build is presumably created by the gulp command "installweb" specified in the main Dockerfile.

---

I'm gathering from the series commands exported by the gulpfile...

```
exports['dev'] = series(buildapp, dev);
exports['fakeprod'] = series(buildnginx, buildapp, fakeprod);

dev: buildapp() ("docker build Dockerfile") -> dev() ("docker compose ./docker-compose-dev.yml")
fakeprod: buildnginx() ("docker build Dockerfile.nginx") -> buildapp() ("docker build Dockerfile") -> fakeprod() ("docker compose ./docker-compose.yml")
```

that buildnginx() is only run in fakeprod ("./bin/ss fakeprod" command) -- so in fakeprod, Dockerfile.nginx is run before Dockerfile, which builds the frontend and bundles it in the nginx container; whereas in dev, the frontend runs on a node dev server.

So first you build the container with Dockerfile, then compose?

---

I'm just confused that both nginx and web services are listed in docker-compose-dev.yml:

```
nginx:
    container_name: nginx
    image: nginx:1.21
    volumes:
    - ./nginx/nginx.dev.conf:/etc/nginx/nginx.conf
    links:
    - api
    - web
    ports:
    - 80:80

// node
web:
    container_name: web
    image: codebase:latest
    volumes:
    - ./web/src:/app/web/src
    - ./web/public:/app/web/public
    command: ['yarn', 'dev:web']
```

---

Explain nginx.dev.conf:

```
http { 

client_max_body_size 2G;

server {
    listen 80;

    location / {
    proxy_pass http://web:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    }

    location /altair {
    proxy_pass http://api:3000;
    }

    location /health {
    proxy_pass http://api:3000;
    }

    location /graphql {
    proxy_pass http://api:3000;
    }
}
}

events {}
```

as contrasted with nginx.fakeprod.conf:

```
http {
include mime.types;

client_max_body_size 2G;

gzip on;
gzip_proxied any;
gzip_types text/plain application/json;
gzip_min_length 1000;

# Lie about scheme since it's fake prod.
proxy_set_header X-Forwarded-Proto https;

server {
    listen 80;
    
    root /www/data;
    index index.html

    error_page 404 =200 /;

    location / {
    try_files $uri /index.html;
    }

    location /altair {
    proxy_pass http://api:3000;
    }

    location /health {
    proxy_pass http://api:3000;
    }

    location /graphql {
    proxy_pass http://api:3000;
    }
}
}

events {}
```

Further, explain how the docker-compose files copy the nginx.conf files into the appropriate docker container, 

---

And how do compose files know where to find the image mounted by a Dockerfile?

---

I've been using this project on and off for a while to develop architectural knowledge. Am I a maniacal genius?

---

how does the nginx container understand what "http://web:3000" and "http://api:3000" mean? are those actual domains, or shorthand for localhost:3000 in each container?

---

So docker is imposing a communications layer on top of http. otherwise, i'm not sure how those domains would work, virtualization or not.

---

so communication between services (i.e., frontend and backend, or backend and redis), is happening on different internal hosts + same port, rather than same host + different ports as in a typical dev environment?

---

why would redis need its own container for a session store when the api container could simply import connect-redis as usually happens?

---

do these internal domains work in a browser on the physical machine? how does the cra frontend communicate with them in dev? what is a docker "link"? why do only some services across the docker-compose files have "build: context ."? How do two images between both Dockerfiles become 5+ containers? Perhaps break down both docker-compose files again bearing these questions in mind.

---

so build applies to images built from existing dockerfiles, and build isn't included for images specified directly in the docker-compose. comments below to demonstrate understanding:


```
version: '3.7'

services:

# build container from Dockerfile.nginx image

nginx:
    container_name: nginx
    image: codebasenginx:latest
    volumes:
    - ./nginx/nginx.fakeprod.conf:/etc/nginx/nginx.conf
    links:
    - api
    ports:
    - 80:80

# build containers from Dockerfile image (same backend, different service)

migrate:
    container_name: migrate
    image: codebase:latest
    build:
    context: .
    env_file:
    - ./env/fakeprod.env
    - ./env/secrets.env
    links:
    - db
    command: 'bash -c "cd api && yarn migrate && yarn seed"'

api:
    container_name: api
    image: codebase:latest
    env_file:
    - ./env/fakeprod.env
    - ./env/secrets.env
    links:
    - db
    - redis
    command: ['node', '/app/api/build/entrypoints/api.js']

worker:
    container_name: worker
    image: codebase:latest
    build:
    context: .
    env_file:
    - ./env/fakeprod.env
    - ./env/secrets.env
    environment:
    NODE_ENV: production
    PORT: 3000
    links:
    - db
    - redis
    ports:
    - 3000:3000
    command: ['node', '/app/api/build/entrypoints/worker.js']

dispatcher:
    container_name: dispatcher
    image: codebase:latest
    build:
    context: .
    env_file:
    - ./env/fakeprod.env
    - ./env/secrets.env
    environment:
    NODE_ENV: production
    PORT: 3001
    links:
    - db
    - redis
    ports:
    - 3001:3001
    command: ['node', '/app/api/build/entrypoints/dispatcher.js']

# build containers from other images
    
db:
    container_name: db
    image: postgres:11
    restart: always
    environment:
    POSTGRES_DB: codebase
    POSTGRES_USER: codebase
    POSTGRES_PASSWORD: codebase
    ports:
    - 5432:5432

redis:
    container_name: redis
    image: redis:5.0
```

---

then why don't any services have build fields in docker-compose.dev.yml? it's only used in the fakeprod version. look:

```
version: '3.7'

services:

# ===========================================
# build container from Dockerfile image (frontend)
# ===========================================

web:
    container_name: web
    image: codebase:latest
    volumes:
    - ./web/src:/app/web/src
    - ./web/public:/app/web/public
    command: ['yarn', 'dev:web']

# ===========================================
# build containers from Dockerfile image (same backend, different service)
# ===========================================

api:
    container_name: api
    image: codebase:latest
    env_file:
    - ./env/dev.env
    - ./env/secrets.env
    volumes:
    - ./api/src:/app/api/src
    links:
    - db
    - redis
    ports:
    - 3000:3000
    command: ['yarn', 'dev:api']

migrate:
    container_name: migrate
    image: codebase:latest
    env_file:
    - ./env/dev.env
    - ./env/secrets.env
    volumes:
    - ./api/src:/app/api/src
    links:
    - db
    command: 'bash -c "yarn migrate && yarn seed"'

worker:
    container_name: worker
    image: codebase:latest
    env_file:
    - ./env/dev.env
    - ./env/secrets.env
    environment:
    PORT: 3001
    volumes:
    - ./api/src:/app/api/src
    links:
    - db
    - redis
    ports:
    - 3001:3001
    command: ['yarn', 'dev:worker']

dispatch:
    container_name: dispatcher
    image: codebase:latest
    env_file:
    - ./env/dev.env
    - ./env/secrets.env
    environment:
    PORT: 3002
    volumes:
    - ./api/src:/app/api/src
    links:
    - db
    - redis
    ports:
    - 3002:3002
    command: ['yarn', 'dev:dispatcher']

# ===========================================
# build containers from Docker Hub
# ===========================================

db:
    container_name: db
    image: postgres:11
    restart: always
    environment:
    POSTGRES_DB: codebase
    POSTGRES_USER: codebase
    POSTGRES_PASSWORD: codebase
    ports:
    - 5432:5432

redis:
    container_name: redis
    image: redis:5.0

# nginx as reverse proxy only
nginx:
    container_name: nginx
    image: nginx:1.21
    volumes:
    - ./nginx/nginx.dev.conf:/etc/nginx/nginx.conf
    links:
    - api
    - web
    ports:
    - 80:80
```

---

"docker build -t" is run in both dev and fakeprod. 

gulpfile.ts:

```
exports['dev'] = series(buildapp, dev);
exports['fakeprod'] = series(buildnginx, buildapp, fakeprod);

async function buildapp() {
const dockerTag = DOCKER_TAG.getOrDefault('codebase:latest');
const dockerfile = DOCKERFILE.getOrDefault('Dockerfile');

await docker.build(dockerfile, dockerTag);
}
```

---