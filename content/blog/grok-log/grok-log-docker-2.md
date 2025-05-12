---
author: 'Joe Lauletta'
date: 2025-05-10
title: 'grok-log-docker-2'
tags: ['tech']

# draft: true
---

## As I studied an open-source codebase with intent to contribute, I used [ChatGPT](https://chatgpt.com) as a note-taking tool. This is my side of one of our conversations.

---

when installing dependencies in a legacy node project, how do i ensure that "yarn install" adheres to yarn.lock? could the issue be my node version? is this the pain point that explains the beauty of docker?

---

i have one. i'm realizing that my project's dev environment runs in a docker container, which INCLUDES the frontend's CRA dev server -- nothing is ever running local in dev or fakeprod. but supposedly the dev server is accessible from http://localhost (even though, with HMR intact? How does a Ctrl + S event travel from VSCode to the running docker container to the browser?

---

can the dev server inside the container make requests to origins existing outside of it?

---

so when frontend (named "web") and backend (named "api") containers are spun up from docker-compose.yml, they're linked such that the frontend can make requests to http://api:[specified-port]?

---

but i assume the browser can't request the frontend from http://web:[port]. that domain is internal to the docker network

---

so the backend container may have http://web:3000 in its cors whitelist, etc.?

---