import * as path from 'path';
import * as config from '../config.json';
import cdk = require('aws-cdk-lib');
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class Ec2Server extends Construct {
    public readonly vpc: ec2.IVpc;
    public readonly publicIpSsmParamName: string;
    constructor(scope: Construct, id: string) {
        super(scope, id);

        // // uncomment to deploy a new VPC (comment out if using the default VPC)
        // this.vpc = new ec2.Vpc(this, 'VPC', {
        //     natGateways: 0,
        //     subnetConfiguration: [{
        //         name: 'Vpc',
        //         subnetType: ec2.SubnetType.PUBLIC,
        //         cidrMask: 24
        //     }],
        //     enableDnsHostnames: true,
        //     enableDnsSupport: true
        // });

        // uncomment to use the existing default VPC (comment out if deploying a new VPC)
        this.vpc = ec2.Vpc.fromLookup(this, 'VPC', {
            isDefault: true,
          });

        const securityGroup = new ec2.SecurityGroup(this, 'Ec2ServerSecurityGroup', {
            vpc: this.vpc,
            allowAllOutbound: true,
        });

        // Set in config.json
        for (const port of config.layers.server.security_group_inbound_config) {
            securityGroup.addIngressRule(
                ec2.Peer.ipv4(port.cidr),
                ec2.Port.tcp(port.port),
                port.description
            );
        }

        // IAM role for the instance allows SSM access
        const role = new iam.Role(this, 'Role', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
            ]
        });
        
        // Amazon Linux 2 2023 image
        const ami = ec2.MachineImage.latestAmazonLinux2023();
        
        // create the instance
        const instance = new ec2.Instance(this, 'DockerComposeServer', {
            vpc: this.vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
            machineImage: ami,
            securityGroup,
            keyName: config.layers.server.env.ssh_key_name,
            role,
            instanceName: config.tags.app,
            blockDevices: [{
                deviceName: '/dev/xvda',
                volume: ec2.BlockDeviceVolume.ebs(config.layers.server.env.ebs_volume_size)
            }]
        });

        // add the user data script
        const userData = new Asset(this, 'UserData', {
            path: path.join(__dirname, '../src/config.sh')
        });

        const localPath = instance.userData.addS3DownloadCommand({
            bucket: userData.bucket,
            bucketKey: userData.s3ObjectKey
        });

        instance.userData.addExecuteFileCommand({
            filePath: localPath,
            arguments: '--verbose -y'
        });
        userData.grantRead(instance.role);

    // Declare `public_ip` at the function scope
    let public_ip: string;  // assuming it's a string, adjust type accordingly

    // Check if an existing Elastic IP allocation ID is provided
    if (config.layers.server.elastic_ip.allocation_id) {
        // Associate the EIP with the instance using the existing allocation ID
        new ec2.CfnEIPAssociation(this, 'EIPAssociation', {
            allocationId: config.layers.server.elastic_ip.allocation_id,
            instanceId: instance.instanceId
        });

        // Assign the provided public IP to the variable
        public_ip = config.layers.server.elastic_ip.public_ip;

        console.log(`Using existing Elastic IP ${public_ip} from config`);

    } else {
        console.log('No Elastic IP provided in config, creating a new one...');

        // Create a new Elastic IP
        const eip = new ec2.CfnEIP(this, 'EIP', {
            domain: 'vpc'
        });

        // Associate the newly created EIP with the instance
        new ec2.CfnEIPAssociation(this, 'EIPAssociation', {
            allocationId: eip.ref,  // Correctly using `eip.ref` for new EIP association
            instanceId: instance.instanceId
        });

        // Use the new EIP's public IP
        public_ip = eip.attrPublicIp;

        console.log(`Created new Elastic IP ${public_ip}`);
    }

    // SSM parameters for instance ID
    new ssm.StringParameter(this, 'InstanceId', {
        parameterName: `/${config.tags.org}/${config.tags.app}/InstanceId`,
        simpleName: false,
        stringValue: instance.instanceId
    });

    // SSM parameter and CDK output for public IP
    const publicIpSsmParam = new ssm.StringParameter(this, 'PublicIpParam', {
        parameterName: `/${config.tags.org}/${config.tags.app}/PublicIp`,
        simpleName: false,
        stringValue: public_ip
    });

    this.publicIpSsmParamName = publicIpSsmParam.parameterName;
    new cdk.CfnOutput(this, 'PublicIpOutput', { value: public_ip });
    }
}
