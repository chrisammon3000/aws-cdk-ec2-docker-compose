// import * as config from '../config.json';
import * as cdk from 'aws-cdk-lib';
import { Ec2Server } from './server';

export class Ec2DockerComposeStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Ec2Server(this, 'Ec2Server');

  }
}
