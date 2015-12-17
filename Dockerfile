FROM 122.18.125.119:5000/icbc/suse12:nodejs
MAINTAINER chenjj2@sdc.icbc.com.cn

RUN echo "122.16.125.7 gitlab.sdc.icbc">>/etc/hosts; mkdir -p /washome/apps; cd /washome/apps; git clone http://gitlab.sdc.icbc/huangxl/pai-js.git 

ENV PAI_PORT 9898
EXPOSE $PAI_PORT
RUN echo "122.16.125.7 gitlab.sdc.icbc">>/etc/hosts; cd /washome/apps/pai-js; node install.js; npm run build
CMD /washome/apps/pai-js; npm run serv 