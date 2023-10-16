import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdkEc2 from 'aws-cdk-lib/aws-ec2';
import * as myEc2 from '../ec2-construct';

describe('Check InstancesProps.vpc', () => {
  const instancesProps = {
    '1st': {
      constructProps: {
        instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
        machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
      },
    },
  };

  const testData1: (myEc2.VpcProps)[] = [
    {
      type: 'VpcProps',
    },
    {
      type: 'VpcProps',
      constructProps: { ipAddresses: cdkEc2.IpAddresses.cidr('192.168.1.0/24') },
    },
  ];
  
  test.each(testData1)('Is there a specified number of VPC? InstancesProps.vpc is %j', (props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: props,
      instances: instancesProps,
    });
    const template = Template.fromStack(stack);
    // VPC
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: props.constructProps?.ipAddresses ? props.constructProps.ipAddresses.allocateVpcCidr().cidrBlock : '10.0.0.0/16',
    });
    const vpcs = template.findResources('AWS::EC2::VPC');
    // Instance
    template.resourceCountIs('AWS::EC2::Instance', 1);
    const instances = template.findResources('AWS::EC2::Instance');
    const subnets = template.findResources('AWS::EC2::Subnet');
    expect(Object.keys(vpcs)).toContain(subnets[Object.values(instances)[0].Properties.SubnetId.Ref].Properties.VpcId.Ref);
  });
  
  test('InstancesProps.vpc is IVpc', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '999999999999',
        region: 'us-east-1',
      },
    });
    const vpc = cdkEc2.Vpc.fromLookup(stack, 'Vpc', { vpcId: 'vpc-example1'});
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: {
        type: 'Vpc',
        resource: vpc,
      },
      instances: instancesProps,
    });
    const template = Template.fromStack(stack);
    // VPC
    template.resourceCountIs('AWS::EC2::VPC', 0);
    // Instance
    template.resourceCountIs('AWS::EC2::Instance', 1);
    template.hasResourceProperties('AWS::EC2::Instance', {
      SubnetId: 'p-12345',
    });
  });

  test('InstancesProps.vpc is another VPC construct', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new cdkEc2.Vpc(stack, 'Vpc');
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: {
        type: 'Vpc',
        resource: vpc,
      },
      instances: instancesProps,
    });
    const template = Template.fromStack(stack);
    // VPC
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
    const vpcs = template.findResources('AWS::EC2::VPC', {
      UpdateReplacePolicy: Match.absent(),
      DeletionPolicy: Match.absent(),
    });
    expect(Object.keys(vpcs)).toHaveLength(1);
    // Instance
    template.resourceCountIs('AWS::EC2::Instance', 1);
    const instances = template.findResources('AWS::EC2::Instance');
    const subnets = template.findResources('AWS::EC2::Subnet');
    expect(Object.keys(vpcs)).toContain(subnets[Object.values(instances)[0].Properties.SubnetId.Ref].Properties.VpcId.Ref);
  });
});

describe('Check InstancesProps.instances', () => {
  const vpcProps: myEc2.VpcProps = {
    type: 'VpcProps',
  };

  const testData1: {[key:string]:myEc2.InstanceProps}[] = [
    {
      '1st': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
      },
    },
    {
      '1st': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
      },
      '2nd': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.M5, cdkEc2.InstanceSize.LARGE),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
      },
    },
  ];

  test.each(testData1)('Is there a specified number of Instance? InstancesProps.instances is %j', (props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: props,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::Instance', Object.keys(props).length);
    for (const [key, instanceProps] of Object.entries(props)) {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: instanceProps.constructProps.instanceType.toString(),
      });
    }
  });

  const testData2: {[key:string]:myEc2.InstanceProps}[] = [
    {
      '1st': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
        relation: {
          keyPair: '1st',
        },
      },
      '2nd': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.M5, cdkEc2.InstanceSize.LARGE),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
        relation: {
          keyPair: '1st',
        },
      },
    },
    {
      '1st': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
        relation: {
          keyPair: '1st',
        },
      },
      '2nd': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.M5, cdkEc2.InstanceSize.LARGE),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
        relation: {
          keyPair: '2nd',
        },
      },
    },
  ];

  test.each(testData2)('Is the specified KeyPair assigned? InstancesProps.instances is %j', (props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const keyPairProps: {[key: string]: myEc2.CfnKeyPairProps} = {
      '1st': {
        type: 'CfnKeyPairProps',
        constructProps: {
          keyName: 'KeyPair1',
        },
      },
      '2nd': {
        type: 'CfnKeyPairProps',
        constructProps: {
          keyName: 'KeyPair2',
        },
      },
    };
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: props,
      keyPairs: keyPairProps,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::Instance', Object.keys(props).length);
    for (const [key, instanceProps] of Object.entries(props)) {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: instanceProps.constructProps.instanceType.toString(),
        KeyName: {
          Ref: Match.stringLikeRegexp(`^MyEc2InstancesKeyPair${instanceProps.relation?.keyPair}`),
        },
      });
    }
  });

  const testData4: {[key:string]:myEc2.InstanceProps}[] = [
    {
      '1st': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
        relation: {
          securityGroup: '1st',
        },
      },
      '2nd': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.M5, cdkEc2.InstanceSize.LARGE),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
        relation: {
          securityGroup: '1st',
        },
      },
    },
    {
      '1st': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
        relation: {
          securityGroup: '1st',
        },
      },
      '2nd': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.M5, cdkEc2.InstanceSize.LARGE),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
        relation: {
          securityGroup: '2nd',
        },
      },
    },
  ];

  test.each(testData4)('Is the specified SecurityGroup assigned? InstancesProps.instances is %j', (props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const securityGroupsProps: {[key: string]: myEc2.SecurityGroupProps} = {
      '1st': {
        type: 'SecurityGroupProps',
      },
      '2nd': {
        type: 'SecurityGroupProps',
      },
    };
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: props,
      securityGroups: securityGroupsProps,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::Instance', Object.keys(props).length);
    for (const [key, instanceProps] of Object.entries(props)) {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: instanceProps.constructProps.instanceType.toString(),
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [
              Match.stringLikeRegexp(`^MyEc2InstancesSecurityGroup${instanceProps.relation?.securityGroup}`),
              'GroupId',
            ],
          },
        ],
      });
    }
  });
});

describe('Check InstancesProps.keyPairs', () => {
  const vpcProps: myEc2.VpcProps = {
    type: 'VpcProps',
  };
  const instanceProps = {
    '1st': {
      constructProps: {
        instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
        machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
      },
    },
  };

  const testData1: {[key:string]:myEc2.CfnKeyPairProps}[] = [
    {
      '1st': {
        type: 'CfnKeyPairProps',
        constructProps: {
          keyName: 'TestKey1',
        },
      },
    },
    {
      '1st': {
        type: 'CfnKeyPairProps',
        constructProps: {
          keyName: 'TestKey1',
        },
      },
      '2nd': {
        type: 'CfnKeyPairProps',
        constructProps: {
          keyName: 'TestKey2',
        },
      },
    },
  ];

  test.each(testData1)('Is there a specified number of KeyPair? InstancesProps.keyPairs is %j', (props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: instanceProps,
      keyPairs: props,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::KeyPair', Object.keys(props).length);
    for (const [key, keyPairProps] of Object.entries(props)) {
      template.hasResourceProperties('AWS::EC2::KeyPair', {
        KeyName: keyPairProps.constructProps.keyName,
      });
    }
  });

  const testData2 = [
    [
      '1st',
    ],
    [
      '1st',
      '2nd',
    ],
  ];

  test.each(testData2)('InstancesProps.keyPairs is another KeyPair construct. Test data is %j', (...props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const keyPairsProps = props.reduce<{[key: string]: myEc2.CfnKeyPair}>((pre, key) => {
      return {
        ...pre,
        [key]: {
          type: 'CfnKeyPair',
          resource: new cdkEc2.CfnKeyPair(stack, 'KeyPair' + key, {
            keyName: 'KeyPair' + key,
          }),
        },
      };
    }, {});
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: instanceProps,
      keyPairs: keyPairsProps,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::KeyPair', props.length);
    for (const key of props) {
      template.hasResourceProperties('AWS::EC2::KeyPair', {
        KeyName: 'KeyPair' + key,
      });
    }
  });
});

describe('Check InstancesProps.securityGroups', () => {
  const vpcProps: myEc2.VpcProps = {
    type: 'VpcProps',
  };
  const instancesProps = {
    '1st': {
      constructProps: {
        instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
        machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
      },
    },
  };

  const testData1: {[key:string]:myEc2.SecurityGroupProps}[] = [
    {
      '1st': {
        type: 'SecurityGroupProps',
      },
    },
    {
      '1st': {
        type: 'SecurityGroupProps',
      },
      '2nd': {
        type: 'SecurityGroupProps',
      },
    },
  ];

  test.each(testData1)('Is there a specified number of SecurityGroup? InstancesProps.securityGroupsProps is %j', (props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: instancesProps,
      securityGroups: props,
    });
    const template = Template.fromStack(stack);
    template.resourcePropertiesCountIs('AWS::EC2::SecurityGroup', {
      Tags: Match.absent(),
    }, Object.keys(props).length);
    for (const [key, keyPairProps] of Object.entries(props)) {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: `TestStack/MyEc2Instances/SecurityGroup${key}`,
      });
    }
  });

  const testData2: {[key:string]:myEc2.SecurityGroupProps}[] = [
    {
      '1st': {
        type: 'SecurityGroupProps',
        constructProps: {
          description: 'This is SecurityGroup description for Example1',
          securityGroupName: 'Example1',
        },
      },
    },
    {
      '1st': {
        type: 'SecurityGroupProps',
        constructProps: {
          description: 'This is SecurityGroup description for Example1',
          securityGroupName: 'Example1',
        },
      },
      '2nd': {
        type: 'SecurityGroupProps',
        constructProps: {
          description: 'This is SecurityGroup description for Example2',
          securityGroupName: 'Example2',
        },
      },
    },
  ];

  test.each(testData2)('Is the specified SecurityGroupProps assigned? InstancesProps.securityGroup is %j', (props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: instancesProps,
      securityGroups: props,
    });
    const template = Template.fromStack(stack);
    template.resourcePropertiesCountIs('AWS::EC2::SecurityGroup', {
      Tags: Match.absent(),
    }, Object.keys(props).length);
    for (const [key, securityGroupsProps] of Object.entries(props)) {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: securityGroupsProps.constructProps?.description,
      });
    }
  });

  const testData3 = [
    [
      '1st',
    ],
    [
      '1st',
      '2nd',
    ],
  ];

  test.each(testData3)('InstancesProps.securityGroups is another SecurityGroup construct. Test data is %j', (...props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new cdkEc2.Vpc(stack, 'Vpc', vpcProps.constructProps);
    const securityGroupsProps = props.reduce<{[key: string]: myEc2.SecurityGroup}>((pre, key) => {
      return {
        ...pre,
        [key]: {
          type: 'SecurityGroup',
          resource: new cdkEc2.SecurityGroup(stack, 'SecurityGroup' + key, {
            vpc: vpc,
          }),
        },
      };
    }, {});
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: {
        type: 'Vpc',
        resource: vpc,
      },
      instances: instancesProps,
      securityGroups: securityGroupsProps,
    });
    const template = Template.fromStack(stack);
    template.resourcePropertiesCountIs('AWS::EC2::SecurityGroup', {
      Tags: Match.absent(),
    }, props.length);
    for (const key of props) {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'TestStack/SecurityGroup' + key,
      });
    }
  });

  test('InstancesProps.securityGroups is ISecurityGroup', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '999999999999',
        region: 'us-east-1',
      },
    });
    const securityGroup = cdkEc2.SecurityGroup.fromLookupById(stack, 'SecurityGroup', 'sg-12345');
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: instancesProps,
      securityGroups: {
        '1st': {
          type: 'SecurityGroup',
          resource: securityGroup,
        },
      },
    });
    const template = Template.fromStack(stack);
    template.resourcePropertiesCountIs('AWS::EC2::SecurityGroup', {
      Tags: Match.absent(),
    }, 0);
  });
});

describe('Check InstancesProps.elasticIps', () => {
  const vpcProps: myEc2.VpcProps = {
    type: 'VpcProps',
  };
  const instancesProps = {
    '1st': {
      constructProps: {
        instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
        machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
      },
    },
    '2nd': {
      constructProps: {
        instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.M5, cdkEc2.InstanceSize.LARGE),
        machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
      },
    },
  };

  const testData1: {[key: string]: myEc2.CfnEIPProps}[] = [
    {
      '1st': {
        type: 'CfnEIPProps',
      },
    },
    {
      '1st': {
        type: 'CfnEIPProps',
      },
      '2nd': {
        type: 'CfnEIPProps',
      },
    },
  ];

  test.each(testData1)('Is there a specified number of EIP? InstancesProps.elasticIps is %j', (props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: instancesProps,
      elasticIps: props,
    });
    const template = Template.fromStack(stack);
    template.resourcePropertiesCountIs('AWS::EC2::EIP', {
      Tags: Match.absent(),
    }, Object.keys(props).length);
  });

  const testData2: {[key: string]: myEc2.CfnEIPProps}[] = [
    {
      '1st': {
        type: 'CfnEIPProps',
        constructProps: {
          tags: [
            {
              key: 'Name',
              value: 'Example1',
            },
          ],
        },
        relation: {
          instance: '1st',
        },
      },
    },
    {
      '1st': {
        type: 'CfnEIPProps',
        constructProps: {
          tags: [
            {
              key: 'Name',
              value: 'Example1',
            },
          ],
        },
        relation: {
          instance: '1st',
        },
      },
      '2nd': {
        type: 'CfnEIPProps',
        constructProps: {
          tags: [
            {
              key: 'Name',
              value: 'Example2',
            },
          ],
        },
        relation: {
          instance: '1st',
        },
      },
    },
    {
      '1st': {
        type: 'CfnEIPProps',
        constructProps: {
          tags: [
            {
              key: 'Name',
              value: 'Example1',
            },
          ],
        },
        relation: {
          instance: '1st',
        },
      },
      '2nd': {
        type: 'CfnEIPProps',
        constructProps: {
          tags: [
            {
              key: 'Name',
              value: 'Example2',
            },
          ],
        },
        relation: {
          instance: '2nd',
        },
      },
    },
  ];

  test.each(testData2)('Is the specified CfnEIPProps assigned? InstancesProps.elasticIps is %j', (props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: instancesProps,
      elasticIps: props,
    });
    const template = Template.fromStack(stack);
    template.resourcePropertiesCountIs('AWS::EC2::EIP', {
      Tags: [
        {
          Key: 'Name',
          Value: Match.stringLikeRegexp('^Example[12]$'),
        },
      ],
    }, Object.keys(props).length);
    for (const [key, value] of Object.entries(props)) {
      const tag =  value.constructProps?.tags?.slice(0, 1)[0];
      template.hasResourceProperties('AWS::EC2::EIP', {
        Tags: [
          {
            Key: tag?.key,
            Value: tag?.value,
          },
        ],
        InstanceId: {
          Ref: Match.stringLikeRegexp(`^MyEc2InstancesInstance${value.relation?.instance}`),
        },
      });
    }
  });

  const testData3 = [
    [
      '1st',
    ],
    [
      '1st',
      '2nd',
    ],
  ];

  test.each(testData3)('InstancesProps.elasticIps is another EIP construct. Test data is %j', (...props) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const elasticIpsProps = props.reduce<{[key: string]: myEc2.CfnEIP}>((pre, key) => {
      return {
        ...pre,
        [key]: {
          type: 'CfnEIP',
          resource: new cdkEc2.CfnEIP(stack, 'Eip' + key, {
          }),
        },
      };
    }, {});
    const construct = new myEc2.Instances(stack, 'MyEc2Instances', {
      vpc: vpcProps,
      instances: instancesProps,
      elasticIps: elasticIpsProps,
    });
    const template = Template.fromStack(stack);
    template.resourcePropertiesCountIs('AWS::EC2::EIP', {
      Tags: Match.absent(),
    }, props.length);
  });
});

describe('Check method "addUserDataCommandsToInstances"', () => {
  const testData1: { instanceKeys: '*' | string[] | undefined }[] = [
    {
      instanceKeys: undefined,
    },
    {
      instanceKeys: '*',
    },
    {
      instanceKeys: [
        '1st',
      ],
    },
    {
      instanceKeys: [
        '2nd',
      ],
    },
    {
      instanceKeys: [
        '2nd',
        '1st',
      ],
    },
  ];
  test.each(testData1)('Test data is %j', ({instanceKeys}) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const instancesProps = {
      '1st': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
      },
      '2nd': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
      },
    };
    const construct = new myEc2.Instances(stack, 'Instances', {
      vpc: {
        type: 'VpcProps',
      },
      instances: instancesProps,
    });
    const commands = [
      'dnf install httpd',
      'systemctl start httpd',
    ];
    construct.addUserDataCommandsToInstances(
      commands,
      instanceKeys,
    );
    const template = Template.fromStack(stack);
    if (!instanceKeys || instanceKeys === '*') {
      template.resourcePropertiesCountIs('AWS::EC2::Instance', {
        UserData: {
          'Fn::Base64': [
            '#!/bin/bash',
            ...commands,
          ].join('\n'),
        },
      }, Object.keys(instancesProps).length);
    } else {
      template.resourcePropertiesCountIs('AWS::EC2::Instance', {
        UserData: {
          'Fn::Base64': [
            '#!/bin/bash',
            ...commands,
          ].join('\n'),
        },
      }, instanceKeys.length);
      for (const key of instanceKeys) {
        template.hasResourceProperties('AWS::EC2::Instance', {
          UserData: {
            'Fn::Base64': [
              '#!/bin/bash',
              ...commands,
            ].join('\n'),
          },
          Tags: [
            {
              Key: 'Name',
              Value: `TestStack/Instances/Instance${key}`,
            },
          ],
        });
      }
    }
  });
});

describe('Check method "addOutPutCommandGetKeyPair"', () => {
  test('addOutPutCommandGetKeyPair("1st")', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const construct = new myEc2.Instances(stack, 'Instances', {
      vpc: {
        type: 'VpcProps',
      },
      instances: {
        '1st': {
          constructProps: {
            instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
            machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
          },
        },
      },
      keyPairs: {
        '1st': {
          type: 'CfnKeyPairProps',
          constructProps: {
            keyName: 'TestStackExampleKey',
          },
        },
      },
    });
    construct.addOutPutCommandGetKeyPair('1st');
    const template = Template.fromStack(stack);
    template.hasOutput('*', {
      Value: {
        'Fn::Join': [
          '',
          [
            'aws ssm get-parameter --name /ec2/keypair/',
            {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('^InstancesKeyPair1st'),
                'KeyPairId',
              ],
            },
            ' --with-decryption --query Parameter.Value --output text',
          ],
        ],
      },
    });
  });
});

describe('Check method "addIngressRulesToSecurityGroups"', () => {
  const testData1: { securityGroupKeys: '*' | string[] | undefined }[] = [
    {
      securityGroupKeys: undefined,
    },
    {
      securityGroupKeys: '*',
    },
    {
      securityGroupKeys: [
        '1st',
      ],
    },
    {
      securityGroupKeys: [
        '2nd',
      ],
    },
    {
      securityGroupKeys: [
        '2nd',
        '1st',
      ],
    },
  ];
  test.each(testData1)('Test data is %j', ({securityGroupKeys}) => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const instancesProps = {
      '1st': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
        relation: {
          securityGroup: '1st',
        },
      },
      '2nd': {
        constructProps: {
          instanceType: cdkEc2.InstanceType.of(cdkEc2.InstanceClass.T2, cdkEc2.InstanceSize.MICRO),
          machineImage: cdkEc2.MachineImage.latestAmazonLinux2023(),
        },
        relation: {
          securityGroup: '1st',
        },
      },
    };
    const securityGroupsProps: {[key: string]: myEc2.SecurityGroupProps} = {
      '1st': {
        type: 'SecurityGroupProps',
      },
      '2nd': {
        type: 'SecurityGroupProps',
      },
    };
    const construct = new myEc2.Instances(stack, 'Instances', {
      vpc: {
        type: 'VpcProps',
      },
      instances: instancesProps,
      securityGroups: securityGroupsProps,
    });
    const ingressRules = [
      {
        peer: cdkEc2.Peer.anyIpv4(),
        connection: cdkEc2.Port.tcp(80),
      },
      {
        peer: cdkEc2.Peer.ipv4('192.168.1.0/24'),
        connection: cdkEc2.Port.tcp(22),
      },
    ];
    const templateIngressRules = ingressRules.map(({peer, connection}) => {
      return {
        CidrIp: peer.toIngressRuleConfig().cidrIp,
        Description: Match.anyValue(),
        FromPort: connection.toRuleJson().fromPort,
        IpProtocol: connection.toRuleJson().ipProtocol,
        ToPort: connection.toRuleJson().toPort,
      };
    });
    construct.addIngressRulesToSecurityGroups(
      ingressRules,
      securityGroupKeys,
    );
    const template = Template.fromStack(stack);
    template.resourcePropertiesCountIs('AWS::EC2::SecurityGroup', {
    }, Object.keys(securityGroupsProps).length);
    if (!securityGroupKeys || securityGroupKeys === '*') {
      template.resourcePropertiesCountIs('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: templateIngressRules,
      }, Object.keys(securityGroupsProps).length);
    } else {
      for (const key of securityGroupKeys) {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: `TestStack/Instances/SecurityGroup${key}`,
          SecurityGroupIngress: templateIngressRules,
        });
      }
    }
  });
});
