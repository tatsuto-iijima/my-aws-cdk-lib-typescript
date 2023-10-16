import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface InstancesProps {
  readonly instances: {
    readonly [key: string]: InstanceProps;
  };
  readonly vpc: VpcProps | Vpc;
  readonly elasticIps?: {
    readonly [key: string]: CfnEIPProps | CfnEIP;
  };
  readonly keyPairs?: {
    readonly [key: string]: CfnKeyPairProps | CfnKeyPair;
  };
  readonly securityGroups?: {
    readonly [key: string]: SecurityGroupProps | SecurityGroup;
  };
}

export interface InstanceProps {
  readonly constructProps: InstancePropsConstruct;
  readonly relation?: {
    readonly keyPair?: string;
    readonly securityGroup?: string;
  };
}

export interface InstancePropsConstruct extends Omit<ec2.InstanceProps, 'vpc'> {
}

export interface VpcProps {
  readonly type: 'VpcProps';
  readonly constructProps?: ec2.VpcProps;
}

export interface Vpc {
  readonly type: 'Vpc';
  readonly resource: ec2.Vpc | ec2.IVpc;
}

export interface CfnEIPProps {
  readonly type: 'CfnEIPProps',
  readonly constructProps?: ec2.CfnEIPProps,
  readonly relation?: {
    readonly instance?: string;
  };
}

export interface CfnEIP {
  readonly type: 'CfnEIP',
  readonly resource: ec2.CfnEIP,
}

export interface CfnKeyPairProps {
  readonly type: 'CfnKeyPairProps';
  readonly constructProps: ec2.CfnKeyPairProps;
}

export interface CfnKeyPair {
  readonly type: 'CfnKeyPair';
  readonly resource: ec2.CfnKeyPair;
}

export interface SecurityGroupProps {
  readonly type: 'SecurityGroupProps';
  readonly constructProps?: SecurityGroupPropsConstructProps;
}

export interface SecurityGroupPropsConstructProps extends Omit<ec2.SecurityGroupProps, 'vpc'> {
}

export interface SecurityGroup {
  readonly type: 'SecurityGroup';
  readonly resource: ec2.SecurityGroup | ec2.ISecurityGroup;
}

export class Instances extends Construct {
  readonly vpc: ec2.Vpc | ec2.IVpc;
  readonly securityGroups: {[key: string]: ec2.SecurityGroup | ec2.ISecurityGroup};
  readonly keyPairs: {[key: string]: ec2.CfnKeyPair};
  readonly instances: {[key: string]: ec2.Instance};
  readonly elasticIps: {[key: string]: ec2.CfnEIP};

  constructor(scope: Construct, id: string, props: InstancesProps) {
    super(scope, id);
    // VPC
    if (props.vpc.type === 'VpcProps') {
      this.vpc = new ec2.Vpc(this, 'Vpc', props.vpc.constructProps);
    } else {
      this.vpc = props.vpc.resource;
    }
    // Key Pairs
    if (props.keyPairs) {
      this.keyPairs = Object.entries(props.keyPairs).reduce<{[key: string]: ec2.CfnKeyPair}>(
        (pre, [key, value]) => {
          if (value.type === 'CfnKeyPairProps') {
            const keyPair = new ec2.CfnKeyPair(this, 'KeyPair' + key, value.constructProps);
            return {
              ...pre,
              [key]: keyPair,
            };
          } else if (value.type === 'CfnKeyPair') {
            return {
              ...pre,
              [key]: value.resource,
            };
          } else {
            return pre;
          }
        }, {}
      );
    }
    // Security Groups
    if (props.securityGroups) {
      this.securityGroups = Object.entries(props.securityGroups).reduce<{[key: string]: ec2.SecurityGroup | ec2.ISecurityGroup}>(
        (pre, [key, value]) => {
          if (value.type === 'SecurityGroupProps') {
            const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup' + key, {
              ...value.constructProps,
              vpc: this.vpc,
            });
            return {
              ...pre,
              [key]: securityGroup,
            };
          } else if (value.type === 'SecurityGroup') {
            return {
              ...pre,
              [key]: value.resource,
            };
          } else {
            return pre;
          }
        }, {}
      );
    }
    // Instance
    this.instances = Object.entries(props.instances).reduce<{[key: string]: ec2.Instance}>(
      (pre, [key, props]) => {
        const instance = new ec2.Instance(this, 'Instance' + key, {
          ...props.constructProps,
          vpc: this.vpc,
          keyName: props.relation?.keyPair ? cdk.Token.asString(this.keyPairs[props.relation.keyPair].ref) : props.constructProps.keyName,
          securityGroup: props.relation?.securityGroup ? this.securityGroups[props.relation.securityGroup] : props.constructProps.securityGroup,
        });
        return {
          ...pre,
          [key]: instance,
        };
      }, {}
    );
    // EIP
    if (props.elasticIps) {
      this.elasticIps = Object.entries(props.elasticIps).reduce<{[key: string]: ec2.CfnEIP}>(
        (pre, [key, value]) => {
          if (value.type === 'CfnEIPProps') {
            return {
              ...pre,
              [key]: new ec2.CfnEIP(this, 'Eip' + key, {
                ...value.constructProps,
                instanceId: value.relation?.instance ? this.instances[value.relation.instance].instanceId : value.constructProps?.instanceId,
              }),
            };
          } else if (value.type === 'CfnEIP') {
            return {
              ...pre,
              [key]: value.resource,
            };
          } else {
            return pre;
          }
        }, {}
      );
    }
  }

  addUserDataCommandsToInstances(commands: string[], instanceKeys: '*'|string[] = '*') {
    if (instanceKeys === '*') {
      Object.values(this.instances).forEach(instance => instance.addUserData(...commands));
    } else {
      instanceKeys.forEach(instanceKey => this.instances[instanceKey].addUserData(...commands));
    }
  }

  addOutPutCommandGetKeyPair(key: string) {
    new cdk.CfnOutput(this, `CommandGetKeyPair${key}`, {
      value: [
        'aws ssm get-parameter',
        '--name /ec2/keypair/' + this.keyPairs[key].getAtt('KeyPairId'),
        '--with-decryption',
        '--query Parameter.Value',
        '--output text',
      ].join(' '),
    });
  }

  addIngressRulesToSecurityGroups(
    ingressRules: {peer: ec2.IPeer, connection: ec2.Port, description?: string, remoteRule?: boolean}[],
    securityGroupKeys: '*'|string[] = '*'
  ) {
    if (securityGroupKeys === '*') {
      Object.values(this.securityGroups).forEach(
        securityGroup => ingressRules.forEach(
          ingressRule => securityGroup.addIngressRule(
            ingressRule.peer,
            ingressRule.connection,
            ingressRule.description,
            ingressRule.remoteRule
          )
        )
      );
    } else {
      securityGroupKeys.forEach(
        securityGroupKey => ingressRules.forEach(
          ingressRule => this.securityGroups[securityGroupKey].addIngressRule(
            ingressRule.peer,
            ingressRule.connection,
            ingressRule.description,
            ingressRule.remoteRule
          )
        )
      );
    }
  }
}