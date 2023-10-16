# Amazon EC2 Construct Library

The `my-aws-cdk-lib/ec2-construct` package contains primitives for setting up networking and instances.

```ts nofixture
import * as ec2 from 'my-aws-cdk-lib/ec2-construct';
```

## Instances

Example usage is as follows.

```ts nofixture
declare const vpc: ec2.IVpc;
declare const keyPair: ec2.CfnKeyPair;
declare const securityGroup: ec2.ISecurityGroup;

class MyEc2InstancesStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const instances = new myEc2.Instances(this, 'Instances', {
      /**
       * Requierd
       * VPC launched with this construct.
       * Construct Props follow.
       * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html#construct-props
       */
      vpc: {
        type: 'VpcProps',
      },
      /**
       * You can also specify a VPC from another Scope or an existing VPC.
       */
      // vpc: vpc,
      /**
       * Optional
       * Key Pair launched with this construct.
       */
      keyPairs: {
        '1st': {
          /**
           * Construct Props follow.
           * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.CfnKeyPair.html#construct-props
           */
          type: 'CfnKeyPairProps',
          constructProps: {
            keyName: 'TestMyEc2Instances',
          },
          /**
           * You can also specify a Key Pair from another Scope.
           */
          // type: 'CfnKeyPair',
          // resource: keyPair,
        },
      },
      /**
       * Optional
       * Security Group launched with this construct.
       */
      securityGroups: {
        '1st': {
          /**
           * Construct Props follow. (However, excluding `vpc`.)
           * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SecurityGroup.html#construct-props
           */
          type: 'SecurityGroupProps',
          /**
           * You can also specify a Security Group from another Scope.
           */
          // type: 'SecurityGroup',
          // resource: securityGroup,
        },
        '2nd': {
          type: 'SecurityGroupProps',
        },
      },
      /**
       * Requierd
       * Instance launched with this construct.
       */
      instances: {
        '1st': {
          /**
           * Construct Props follow.
           * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Instance.html#construct-props
           */
          constructProps: {
            instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
            machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
            vpcSubnets: {
              subnetType: cdkEc2.SubnetType.PUBLIC,
            },
          },
          /**
           * Specify the KeyPair and SecurityGroup to attach to the instance.
           */
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
      /**
       * Optional
       * EIP launched with this construct.
       */
      elasticIps: {
        '1st': {
          /**
           * Construct Props follow.
           * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.CfnEIP.html#construct-props
           */
          type: 'CfnEIPProps',
          /**
           * Specify the instance to attach to the EIP.
           */
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
    /**
     * Assign Ingress Rule to SecurityGroup
     */
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
    /**
     * Output the command to get the KeyPair to CloudFormation.
     */
    instances.addOutPutCommandGetKeyPair('1st');
    /**
     * Assign UserData to Instance.
     */
    instances.addUserDataCommandsToInstances([
      'dnf install httpd',
      'systemctl start httpd',
    ]);
  }
}
```