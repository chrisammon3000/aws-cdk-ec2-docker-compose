#!/usr/bin/env node
import 'source-map-support/register';
import * as config from '../config.json';
import * as cdk from 'aws-cdk-lib';
import { Ec2DockerComposeStack } from '../lib/aws-cdk-ec2-docker-compose-stack';

const app = new cdk.App();
const appStack = new Ec2DockerComposeStack(app, 'Ec2DockerComposeStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});

for (const [key, value] of Object.entries(config.tags)) {
    cdk.Tags.of(appStack).add(key, value);
}