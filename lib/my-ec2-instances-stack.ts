import * as cdk from 'aws-cdk-lib';
import * as cdkEc2 from 'aws-cdk-lib/aws-ec2';
import * as myEc2 from 'my-aws-cdk-lib/ec2-construct';

export class MyEc2InstancesStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const instances = new myEc2.Instances(this, 'Instances', {
      vpc: {
        type: 'VpcProps',
      },
      keyPairs: {
        '1st': {
          type: 'CfnKeyPairProps',
          constructProps: {
            keyName: 'TestMyEc2Instances',
          },
        },
      },
      securityGroups: {
        '1st': {
          type: 'SecurityGroupProps',
        },
        '2nd': {
          type: 'SecurityGroupProps',
        },
      },
      instances: {
        '1st': {
          constructProps: {
            instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
            machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
            vpcSubnets: {
              subnetType: cdkEc2.SubnetType.PUBLIC,
            },
          },
          relation: {
            keyPair: '1st',
            securityGroup: '1st',
          },
        },
        '2nd': {
          constructProps: {
            instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
            machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
            vpcSubnets: {
              subnetType: cdkEc2.SubnetType.PUBLIC,
            },
          },
          relation: {
            keyPair: '1st',
            securityGroup: '2nd',
          },
        },
      },
      elasticIps: {
        '1st': {
          type: 'CfnEIPProps',
          relation: {
            instance: '1st',
          },
        },
        '2nd': {
          type: 'CfnEIPProps',
          relation: {
            instance: '2nd',
          },
        },
      },
    });

    instances.addIngressRulesToSecurityGroups([
      {
        peer: cdkEc2.Peer.anyIpv4(),
        connection: cdkEc2.Port.icmpPing(),
      },
      {
        peer: cdkEc2.Peer.anyIpv4(),
        connection: cdkEc2.Port.tcp(22),
      },
      {
        peer: cdkEc2.Peer.anyIpv4(),
        connection: cdkEc2.Port.tcp(80),
      },
    ]);

    instances.addOutPutCommandGetKeyPair('1st');

    instances.addUserDataCommandsToInstances([
      'dnf install httpd',
      'systemctl start httpd',
    ]);
  }
}
