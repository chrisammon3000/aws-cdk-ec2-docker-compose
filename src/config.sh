#! /bin/bash -xe

# Install Docker and Docker Compose
dnf update -y
dnf install -y docker git python3.11 python3.11-pip certbot -y
service docker start
usermod -a -G docker ec2-user
chkconfig docker on
curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose version
mkdir -p /opt/app
chown -R ec2-user:ec2-user /opt/app
# # Clone your application and run Docker Compose
# git clone https://github.com/chrisammon3000/aws-cdk-ec2-docker-compose.git /opt/app
# cd /opt/app && docker-compose up -d