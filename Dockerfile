# Base image
FROM node:20.11.0

# RUN echo 'deb http://mirrors.ustc.edu.cn/debian/ buster main' >/etc/apt/sources.list;\
#     echo 'deb-src http://mirrors.ustc.edu.cn/debian/ buster main' >> /etc/apt/sources.list; \
#     echo 'deb http://mirrors.ustc.edu.cn/debian-security buster/updates main' >> /etc/apt/sources.list; \
#     echo 'deb-src http://mirrors.ustc.edu.cn/debian-security buster/updates main' >> /etc/apt/sources.list; \
#     echo 'deb http://mirrors.ustc.edu.cn/debian/ buster-updates main' >> /etc/apt/sources.list; \
#     echo 'deb-src http://mirrors.ustc.edu.cn/debian/ buster-updates main' >> /etc/apt/sources.list ;\
RUN apt-get -y update; \
    apt-get install -y chromium
    
# Create app directory
WORKDIR /data/live-clip

# Bundle app source
COPY . .

# Install dependencies
RUN npm install

# Start the server using the production build
# CMD ["npm", "run", "start:$NODE_SERVER_TYPE:prod"]
ENTRYPOINT ["sh", "-c", "node ./test/test.js"]

