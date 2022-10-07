FROM ubuntu

ARG BUILDARCH

RUN apt-get update
RUN apt-get install -y wget unzip git fontconfig vim python3-distutils curl maven

# lang
RUN apt-get install -y language-pack-ja-base language-pack-ja locales
RUN locale-gen ja_JP.UTF-8

# insatall java jdk18

RUN if [ "${BUILDARCH}" = "arm64" ]; then \
    curl "http://ports.ubuntu.com/pool/universe/o/openjdk-18/openjdk-18-jdk_18.0.2+9-2~22.04_arm64.deb" -o "jdk.deb"; \
  else \
    curl "http://ports.ubuntu.com/pool/universe/o/openjdk-18/openjdk-18-jdk_18.0.2+9-2~22.04_amd64.deb" -o "jdk.deb"; \
fi

RUN apt-get install -y ./jdk.deb

RUN if [ "${BUILDARCH}" = "arm64" ]; then \
    ln -s /usr/lib/jvm/java-18-openjdk-arm64 /usr/lib/jvm/java-18-openjdk-home; \
  else \
    ln -s /usr/lib/jvm/java-18-openjdk-amd64 /usr/lib/jvm/java-18-openjdk-home; \
fi

ENV JAVA_HOME /usr/lib/jvm/java-18-openjdk-home

# install aws-cli v2
RUN if [ "${BUILDARCH}" = "arm64" ]; then \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "aws-sdk.zip"; \
  else \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "aws-sdk.zip"; \
fi

RUN unzip aws-sdk.zip
RUN ./aws/install

# install pip
RUN curl -kL https://bootstrap.pypa.io/get-pip.py | python3

# install git-remote-codecommit
RUN pip install git-remote-codecommit

# install node
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 1655A0AB68576280 && \
apt-get update && \
apt-get install -y nodejs

# install aws-cdk
RUN npm install -g aws-cdk

# install awsp
RUN npm install -g awsp

# create user
ARG UID=1000
ARG GID=1000
RUN groupadd -g $GID dev \
    && useradd -m -u $UID -g $GID dev

# named volume create and change owner
RUN mkdir -p /workspace/app/bin
RUN chown dev:dev /workspace/app/bin

RUN mkdir -p /workspace/app/build
RUN chown dev:dev /workspace/app/build

RUN mkdir -p /workspace/app/target
RUN chown dev:dev /workspace/app/target

RUN mkdir -p /workspace/cdk/node_modules
RUN chown dev:dev /workspace/cdk/node_modules

# env
RUN echo 'alias awsp="source _awsp"' >> /home/dev/.bashrc

# vim
RUN echo ':set fileencodings=utf-8,cp932,euc-jp,sjis' >> /home/dev/.vimrc
RUN echo ':set encoding=utf-8' >> /home/dev/.vimrc
RUN echo ':set fileformat=unix' >> /home/dev/.vimrc
RUN echo ':set fenc=utf-8' >> /home/dev/.vimrc

# permission
USER dev
