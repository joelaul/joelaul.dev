---
author: 'Joe Lauletta'
date: 2025-05-10
title: 'grok-log-docker-3'
tags: ['tech']

# draft: true
---

## As I studied an open-source codebase with intent to contribute, I used [ChatGPT](https://chatgpt.com) as a note-taking tool. This is my side of one of our conversations.

---

I'm running my react dev server in a docker container. HMR doesn't seem to be working, and I wonder if there's something wrong with the bind mount. Here's my docker-composer.yml (react service name is "web"):

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

I'm using CRA.

---

CHOKIDAR_USEPOLLING=true did work, but according to a stackoverflow discussion I saw, polling causes high CPU usage. Something about "inotify" was suggested as an alternative, but I'm not sure what that means. Can you reiterate the method of hiding node_modules from Chokidar (or whatever tool we need for this) to reduce CPU?

---

Having node_modules in my local source is necessary because I'm troubleshooting this:

```
"./node_modules/@tonaljs/chord/node_modules/@tonaljs/chord-type/dist/index.mjs
Can't import the named export 'EmptyPcset' from non EcmaScript module (only default export is available)"
```

I'm assuming the fix involves editing the @tonaljs import syntax directly, so wouldn't I want the container to track changes in node_modules after all? 

---

The error seems to be global to the entire @tonaljs package, so editing individual files won't help. Here's a few of the 160 current errors showing up in devtools console:

```
vendors~main.chunk.js:255506 ./node_modules/@tonaljs/progression/node_modules/@tonaljs/chord/dist/index.mjs
Can't import the named export 'note' from non EcmaScript module (only default export is available)
console.<computed> @ vendors~main.chunk.js:255506Understand this error
3vendors~main.chunk.js:255506 ./node_modules/@tonaljs/chord/node_modules/@tonaljs/pitch-distance/dist/index.mjs
Can't import the named export 'note' from non EcmaScript module (only default export is available)
console.<computed> @ vendors~main.chunk.js:255506Understand this error
vendors~main.chunk.js:255506 ./node_modules/@tonaljs/pitch-note/dist/index.mjs
Can't import the named export 'pitch' from non EcmaScript module (only default export is available)
console.<computed> @ vendors~main.chunk.js:255506Understand this error
vendors~main.chunk.js:255506 ./node_modules/@tonaljs/tonal/node_modules/@tonaljs/pitch-interval/dist/index.mjs
Can't import the named export 'pitch' from non EcmaScript module (only default export is available)
console.<computed> @ vendors~main.chunk.js:255506Understand this error
vendors~main.chunk.js:255506 ./node_modules/@tonaljs/tonal/node_modules/@tonaljs/pitch-note/dist/index.mjs
Can't import the named export 'pitch' from non EcmaScript module (only default export is available)
console.<computed> @ vendors~main.chunk.js:255506Understand this error
vendors~main.chunk.js:255506 ./node_modules/@tonaljs/pitch-interval/dist/index.mjs
Can't import the named export 'pitch' from non EcmaScript module (only default export is available)
console.<computed> @ vendors~main.chunk.js:255506Understand this error
vendors~main.chunk.js:255506 ./node_modules/@tonaljs/chord/node_modules/@tonaljs/pitch-interval/dist/index.mjs
Can't import the named export 'pitch' from non EcmaScript module (only default export is available)
console.<computed> @ vendors~main.chunk.js:255506Understand this error
vendors~main.chunk.js:255506 ./node_modules/@tonaljs/chord/node_modules/@tonaljs/pitch-note/dist/index.mjs
Can't import the named export 'pitch' from non EcmaScript module (only default export is available)
console.<computed> @ vendors~main.chunk.js:255506Understand this error
vendors~main.chunk.js:255506 ./node_modules/@tonaljs/tonal/node_modules/@tonaljs/mode/node_modules/@tonaljs/pitch-interval/dist/index.mjs
Can't import the named export 'pitch' from non EcmaScript module (only default export is available)
console.<computed> @ vendors~main.chunk.js:255506Understand this error
vendors~main.chunk.js:255506 ./node_modules/@tonaljs/tonal/node_modules/@tonaljs/mode/node_modules/@tonaljs/pitch-note/dist/index.mjs
Can't import the named export 'pitch' from non EcmaScript module (only default export is available)
console.<computed> @ vendors~main.chunk.js:255506Understand this error
vendors~main.chunk.js:255506 ./node_modules/@tonaljs/pcset/dist/index.mjs
Can't import the named export 'range' from non EcmaScript module (only default export is available)
```

---

Can you differentiate the "persistence" use of docker compose volumes from any other uses they might have? Every service besides database and redis has a volumes field -- A database service is the only kind I would imagine persistence between runs is important for, yet it doesn't have one. Additionally, the web and api services are built from a Dockerfile image that already has relevant source directories copied over... so in the event that volumes are a way to access source directories, why the redundancy here?

---

So a Docker image's built-in source directories provide initial state, and volumes allow changes in local source to update those image directories.

---

So just as CRA enables HMR on save in frontend, ts-node-dev enables it in backend, and the respective containers' volume fields make it work.

---

I'm assuming the migrate and db containers connect to the same database, since they use the same creds and there can't be more than one process running on Docker port 5432 at once (this is probably obvious) -- so how is it ensured that the database is running before the migrate container attempts to migrate and seed? Does it matter which source initiates the database, or is it a race condition scenario?

---