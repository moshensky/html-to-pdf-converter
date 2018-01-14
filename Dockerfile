FROM ubuntu:14.04

RUN apt-get update && \
    apt-get install -yq curl && \
    curl --silent --location https://deb.nodesource.com/setup_8.x | sudo -E bash - && \
    apt-get install -yq \
      # node js
      nodejs build-essential \
      # puppeteer dependecies
      gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
      libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
      libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
      libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
      ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget \
      # Test dependencies (graphicsmagick lib equivalent to Travis-CI version)
      graphicsmagick=1.3.18-1ubuntu3 git-all

# Install fonts && update font cache
COPY fonts /usr/share/fonts/truetype
RUN fc-cache -f -v

# Create an unprivileged user
RUN useradd --user-group --create-home --shell /bin/false appuser

ENV HOME=/home/appuser

WORKDIR $HOME
COPY package.json $HOME
COPY package-lock.json $HOME
RUN npm install

ENV NODE_PATH=$HOME/node_modules

WORKDIR $HOME/app
