# aws-cdk-ec2-docker-compose
CDK application to deploy an EC2 instance with Docker Compose installed.

## Table of Contents
- [aws-cdk-ec2-docker-compose](#aws-cdk-ec2-docker-compose)
  * [Table of Contents](#table-of-contents)
  * [Project Structure](#project-structure)
  * [Description](#description)
  * [Quickstart](#quickstart)
  * [Installation](#installation)
    + [Prerequisites](#prerequisites)
    + [Environment Variables](#environment-variables)
    + [CDK Application Configuration](#cdk-application-configuration)
    + [AWS Credentials](#aws-credentials)
  * [Usage](#usage)
    + [Makefile](#makefile)
    + [AWS Deployment](#aws-deployment)
    + [SSH into the EC2 Instance](#ssh-into-the-ec2-instance)
  * [Troubleshooting](#troubleshooting)
  * [References & Links](#references---links)
  * [Authors](#authors)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>

## Project Structure
```bash
.
├── Makefile
├── README.md
├── (aws-cdk-ec2-docker-compose-key-pair.pem)
├── bin
├── cdk.context.json
├── cdk.json
├── config.json                                # CDK application configuration
├── lib                                        # CDK stack   
├── package.json
├── src                                        # EC2 user data
└── tsconfig.json
```

## Description
Deploy a Docker Compose app on an EC2 instance using AWS CDK.

## Quickstart
1. Configure your AWS credentials.
2. Add environment variables to `.env`.
3. Update `config.json` if desired.
4. Run `npm install` to install TypeScript dependencies.
5. Run `STAGE=<stage> make deploy` to deploy the app.

## Installation
Follow the steps to configure the deployment environment.

### Prerequisites
* Nodejs >= 18.0.0
* TypeScript >= 5.1.3
* AWS CDK >= 2.84.0
* AWSCLI
* jq

### Environment Variables
Create a `.env.<stage>` file in the project root. The value for `<stage>` should reflect the environment you are deploying to, e.g. `.env.dev`, `.env.staging`, `.env.prod`.
```bash
# .env.<stage>
CDK_DEFAULT_ACCOUNT=<account_id>
CDK_DEFAULT_REGION=<region>
```

It is mandatory to define the `stage` variable because it is used in the `Makefile` to deploy the application to the correct environment.

***Important:*** *Always use a `.env` file or AWS SSM Parameter Store or Secrets Manager for sensitive variables like credentials and API keys. Never hard-code them, including when developing. AWS will quarantine an account if any credentials get accidentally exposed and this will cause problems.*

***Make sure that `.env` is listed in `.gitignore`***

### CDK Application Configuration
The CDK application configuration is stored in `config.json`. This file contains values for the database layer, the data ingestion layer, and tags. You can update the tags and inbound security group rules to your own values before deploying.
```json
{
    "layers": {
        "server": {
            "env": {
                "ssh_cidr": "0.0.0.0/0", // Update to your IP
                "ssh_key_name": "aws-cdk-ec2-docker-compose-key-pair",
                "ebs_volume_size": 64
            },
            "security_group_inbound_config": [
                {
                    "port": 80,
                    "description": "Allow HTTP access",
                    "cidr": "0.0.0.0/0"
                },
                {
                    "port": 22,
                    "description": "Allow SSH access",
                    "cidr": "0.0.0.0/0"
                }
            ]
        }
    },
    "tags": {
        "org": "my-organization", // Update to your organization
        "app": "aws-cdk-ec2-docker-compose"
    }
}
```

***Important:*** *Make sure that `tsconfig.json` is configured with `"resolveJsonModule": true` so that `config.json` is imported correctly.*

### AWS Credentials
Valid AWS credentials must be available to AWS CLI and SAM CLI. The easiest way to do this is running `aws configure`, or by adding them to `~/.aws/credentials` and exporting the `AWS_PROFILE` variable to the environment.

For more information visit the documentation page:
[Configuration and credential file settings](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)

## Usage

### Makefile
```bash
# Deploy AWS resources
STAGE=<stage> make deploy

# Destroy the application
STAGE=<stage> make destroy

# Get the status of server
STAGE=<stage> make server.status

# Stop server
STAGE=<stage> make server.stop

# Start server
STAGE=<stage> make server.start

# Restart server
STAGE=<stage> make server.restart

# Get the public_ip for server
STAGE=<stage> make server.get.public_ip
```

### AWS Deployment
Once the AWS profile and environment variables are configured, the application can be deployed using `STAGE=<stage> make`.
```bash
# Deploy the application
STAGE=<stage> make deploy
```
The deploy command will build a CloudFormation template from the CDK app, deploy it and install Docker Compose on the EC2 instance.

To destroy the application, run the following command:
```bash
# Destroy the application
STAGE=<stage> make destroy
```

### SSH into the EC2 Instance
An SSH key will be created in the project's root directory. To SSH into the instance you will need to update the permissions.
```bash
chmod 400 aws-cdk-ec2-docker-compose-key-pair.pem

# SSH into the instance using just the IP address
ssh -i aws-cdk-ec2-docker-compose-key-pair.pem ec2-user@<instance_ip>
```

You can get the public IP address of the instance by running the following command:
```bash
# Get the public IP address of the instance
STAGE=<stage> make server.get.public_ip
```

More information about how to SSH into an EC2 instance can be found in the [AWS documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstancesLinux.html).

## Troubleshooting
* Check your AWS credentials in `~/.aws/credentials`
* Check that the environment variables are available to the services that need them

## References & Links
- [EC2 Instance Types](https://aws.amazon.com/ec2/instance-types/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)

## Authors
**Primary Contact:** [@chrisammon3000](https://github.com/chrisammon3000)
