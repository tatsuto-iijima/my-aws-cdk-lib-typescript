import * as cdk from 'aws-cdk-lib';
import {
  Template,
  Match,
} from 'aws-cdk-lib/assertions';
import * as cdkS3 from 'aws-cdk-lib/aws-s3';
import * as cdkIam from 'aws-cdk-lib/aws-iam';
import * as myS3 from '../s3';

describe('Test Construct "Replication"', () => {
  describe('Check ReplicationProps.replicationConfiguration', () => {
  });
  describe.each([
    {versioned: undefined},
    {versioned: false},
  ])('ReplicationProps.bucketProperty.versioned is $versioned', ({versioned}) => {
    const app = new cdk.App();

    const destStack = new cdk.Stack(app, 'S3ReplicationDestStack', {
      env: {
        account: '000000000000',
        region: 'us-east-2',
      },
    });
    const destBucket = new cdkS3.Bucket(destStack, 'Bucket', {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      versioned: true,
    });
  
    const srcStack = new cdk.Stack(app, 'S3ReplicationSrcStack', {
      env: {
        account: '000000000000',
        region: 'us-east-1',
      },
    });
    new myS3.Replication(srcStack, 'S3Replication', {
      bucketProperty: {
        versioned: versioned,
      },
      replicationConfiguration: {
        rules: [
          {
            destination: {
              bucket: destBucket,
            },
            status: true,
          },
        ],
      },
    });
  
    srcStack.addDependency(destStack);
    const template = Template.fromStack(srcStack);
  
    test('S3 Bucket Created with Enabled VersionConfiguration', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ReplicationConfiguration: {
          Role: Match.anyValue(),
          Rules: [
            {
              Destination: {
                Bucket: Match.anyValue(),
              },
              Status: 'Enabled',
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });
  });
  
  describe.each([
    {isAnotherRole: true, description: 'another role'},
    {isAnotherRole: false, description: 'undefined'},
  ])('ReplicationProps.replicationConfiguration.role is $description', ({isAnotherRole}) => {
    const app = new cdk.App();

    const destStack = new cdk.Stack(app, 'S3ReplicationDestStack', {
      env: {
        account: '000000000000',
        region: 'us-east-2',
      },
    });
    const destBucket = new cdkS3.Bucket(destStack, 'Bucket', {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      versioned: true,
    });
  
    const srcStack = new cdk.Stack(app, 'S3ReplicationSrcStack', {
      env: {
        account: '000000000000',
        region: 'us-east-1',
      },
    });
    new myS3.Replication(srcStack, 'S3Replication', {
      replicationConfiguration: {
        rules: [
          {
            destination: {
              bucket: destBucket,
            },
            status: true,
          },
        ],
        role: isAnotherRole ? cdkIam.Role.fromRoleArn(srcStack, 'TestRole', 'arn:aws:iam::000000000000:role/hoge') : undefined,
      },
    });
  
    srcStack.addDependency(destStack);
    const template = Template.fromStack(srcStack);
  
    test('S3 Bucket Created', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ReplicationConfiguration: {
          Role: Match.anyValue(),
          Rules: [
            {
              Destination: {
                Bucket: Match.anyValue(),
              },
              Status: 'Enabled',
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('IAM Role' + (isAnotherRole ? ' not' : '') + ' Created', () => {
      template.resourceCountIs('AWS::IAM::Role', isAnotherRole ? 0 : 1);
    });

    test('IAM Policy' + (isAnotherRole ? ' not' : '') + ' Created', () => {
      template.resourceCountIs('AWS::IAM::Policy', isAnotherRole ? 0 : 1);
      if (!isAnotherRole) {
        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:GetReplicationConfiguration',
                  's3:ListBucket',
                ],
                Resource: {
                  'Fn::GetAtt': [
                    Match.stringLikeRegexp('Bucket'),
                    'Arn',
                  ],
                },
          
              },
              {
                Effect: 'Allow',
                Action: [
                  's3:GetObjectVersionForReplication',
                  's3:GetObjectVersionAcl',
                  's3:GetObjectVersionTagging',
                ],
                Resource: {
                  'Fn::Join': [
                    '',
                    [
                      {
                        'Fn::GetAtt': [
                          Match.stringLikeRegexp('Bucket'),
                          'Arn',
                        ],
                      },
                      '/*',
                    ],
                  ],
                },
              },
              {
                Effect: 'Allow',
                Action: [
                  's3:ReplicateObject',
                  's3:ReplicateDelete',
                  's3:ReplicateTags',
                ],
                Resource: Match.anyValue(),
              },
            ],
          },
        });
      }
    });
  });

  describe.each([
    {status: true, expected: 'Enabled'},
    {status: false, expected: 'Disabled'},
  ])('ReplicationProps.replicationConfiguration.rules[].deleteMarkerReplication.status is $status', ({status, expected}) => {
    const app = new cdk.App();

    const destStack = new cdk.Stack(app, 'S3ReplicationDestStack', {
      env: {
        account: '000000000000',
        region: 'us-east-2',
      },
    });
    const destBucket = new cdkS3.Bucket(destStack, 'Bucket', {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      versioned: true,
    });
  
    const srcStack = new cdk.Stack(app, 'S3ReplicationSrcStack', {
      env: {
        account: '000000000000',
        region: 'us-east-1',
      },
    });
    new myS3.Replication(srcStack, 'S3Replication', {
      replicationConfiguration: {
        rules: [
          {
            deleteMarkerReplication: {
              status: status,
            },
            destination: {
              bucket: destBucket,
            },
            status: true,
          },
        ],
      },
    });

    srcStack.addDependency(destStack);

    const template = Template.fromStack(srcStack);

    test(`S3 Bucket created with ReplicationConfiguration Rule DeleteMarkerReplication ${expected}`, () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ReplicationConfiguration: {
          Role: Match.anyValue(),
          Rules: [
            {
              DeleteMarkerReplication: {
                Status: expected,
              },
              Destination: {
                Bucket: Match.anyValue(),
              },
              Status: 'Enabled',
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('IAM Role Created', () => {
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

    test('IAM Policy Created', () => {
      template.resourceCountIs('AWS::IAM::Policy', 1);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('Bucket'),
                  'Arn',
                ],
              },
        
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('Bucket'),
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: Match.anyValue(),
            },
          ],
        },
      });
    });
  });

  describe.each([
    {status: true, expected: 'Enabled'},
    {status: false, expected: 'Disabled'},
  ])('ReplicationProps.replicationConfiguration.rules[].destination.metrics.status is $status', ({status, expected}) => {
    const app = new cdk.App();

    const destStack = new cdk.Stack(app, 'S3ReplicationDestStack', {
      env: {
        account: '000000000000',
        region: 'us-east-2',
      },
    });
    const destBucket = new cdkS3.Bucket(destStack, 'Bucket', {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      versioned: true,
    });
  
    const srcStack = new cdk.Stack(app, 'S3ReplicationSrcStack', {
      env: {
        account: '000000000000',
        region: 'us-east-1',
      },
    });
    new myS3.Replication(srcStack, 'S3Replication', {
      replicationConfiguration: {
        rules: [
          {
            destination: {
              bucket: destBucket,
              metrics: {
                status: status,
              },
            },
            status: true,
          },
        ],
      },
    });

    srcStack.addDependency(destStack);

    const template = Template.fromStack(srcStack);

    test(`S3 Bucket created with ReplicationConfiguration Rule Destination Metrics Status ${expected}`, () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ReplicationConfiguration: {
          Role: Match.anyValue(),
          Rules: [
            {
              Destination: {
                Bucket: Match.anyValue(),
                Metrics: {
                  Status: expected,
                },
              },
              Status: 'Enabled',
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('IAM Role Created', () => {
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

    test('IAM Policy Created', () => {
      template.resourceCountIs('AWS::IAM::Policy', 1);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('Bucket'),
                  'Arn',
                ],
              },
        
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('Bucket'),
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: Match.anyValue(),
            },
          ],
        },
      });
    });
  });

  describe.each([
    {status: true, expected: 'Enabled'},
    {status: false, expected: 'Disabled'},
  ])('ReplicationProps.replicationConfiguration.rules[].destination.replicationTime.status is $status', ({status, expected}) => {
    const app = new cdk.App();

    const destStack = new cdk.Stack(app, 'S3ReplicationDestStack', {
      env: {
        account: '000000000000',
        region: 'us-east-2',
      },
    });
    const destBucket = new cdkS3.Bucket(destStack, 'Bucket', {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      versioned: true,
    });
  
    const srcStack = new cdk.Stack(app, 'S3ReplicationSrcStack', {
      env: {
        account: '000000000000',
        region: 'us-east-1',
      },
    });
    new myS3.Replication(srcStack, 'S3Replication', {
      replicationConfiguration: {
        rules: [
          {
            destination: {
              bucket: destBucket,
              replicationTime: {
                status: status,
              },
            },
            status: true,
          },
        ],
      },
    });

    srcStack.addDependency(destStack);

    const template = Template.fromStack(srcStack);

    test(`S3 Bucket created with ReplicationConfiguration Rule Destination ReplicationTime Status ${expected}`, () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ReplicationConfiguration: {
          Role: Match.anyValue(),
          Rules: [
            {
              Destination: {
                Bucket: Match.anyValue(),
                ReplicationTime: {
                  Status: expected,
                },
              },
              Status: 'Enabled',
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('IAM Role Created', () => {
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

    test('IAM Policy Created', () => {
      template.resourceCountIs('AWS::IAM::Policy', 1);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('Bucket'),
                  'Arn',
                ],
              },
        
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('Bucket'),
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: Match.anyValue(),
            },
          ],
        },
      });
    });
  });

  describe.each([
    {status: true, expected: 'Enabled'},
    {status: false, expected: 'Disabled'},
  ])('ReplicationProps.replicationConfiguration.rules[].sourceSelectionCriteria.replicaModifications.status is $status', ({status, expected}) => {
    const app = new cdk.App();

    const destStack = new cdk.Stack(app, 'S3ReplicationDestStack', {
      env: {
        account: '000000000000',
        region: 'us-east-2',
      },
    });
    const destBucket = new cdkS3.Bucket(destStack, 'Bucket', {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      versioned: true,
    });
  
    const srcStack = new cdk.Stack(app, 'S3ReplicationSrcStack', {
      env: {
        account: '000000000000',
        region: 'us-east-1',
      },
    });
    new myS3.Replication(srcStack, 'S3Replication', {
      replicationConfiguration: {
        rules: [
          {
            destination: {
              bucket: destBucket,
            },
            sourceSelectionCriteria: {
              replicaModifications: {
                status: status,
              },
            },
            status: true,
          },
        ],
      },
    });

    srcStack.addDependency(destStack);

    const template = Template.fromStack(srcStack);

    test(`S3 Bucket created with ReplicationConfiguration Rule SourceSelectionCriteria ReplicaModifications Status ${expected}`, () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ReplicationConfiguration: {
          Role: Match.anyValue(),
          Rules: [
            {
              Destination: {
                Bucket: Match.anyValue(),
              },
              SourceSelectionCriteria: {
                ReplicaModifications: {
                  Status: expected,
                },
              },
              Status: 'Enabled',
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('IAM Role Created', () => {
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

    test('IAM Policy Created', () => {
      template.resourceCountIs('AWS::IAM::Policy', 1);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('Bucket'),
                  'Arn',
                ],
              },
        
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('Bucket'),
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: Match.anyValue(),
            },
          ],
        },
      });
    });
  });

  describe.each([
    {status: true, expected: 'Enabled'},
    {status: false, expected: 'Disabled'},
  ])('ReplicationProps.replicationConfiguration.rules[].sourceSelectionCriteria.sseKmsEncryptedObjects.status is $status', ({status, expected}) => {
    const app = new cdk.App();

    const destStack = new cdk.Stack(app, 'S3ReplicationDestStack', {
      env: {
        account: '000000000000',
        region: 'us-east-2',
      },
    });
    const destBucket = new cdkS3.Bucket(destStack, 'Bucket', {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      versioned: true,
    });
  
    const srcStack = new cdk.Stack(app, 'S3ReplicationSrcStack', {
      env: {
        account: '000000000000',
        region: 'us-east-1',
      },
    });
    new myS3.Replication(srcStack, 'S3Replication', {
      replicationConfiguration: {
        rules: [
          {
            destination: {
              bucket: destBucket,
            },
            sourceSelectionCriteria: {
              sseKmsEncryptedObjects: {
                status: status,
              },
            },
            status: true,
          },
        ],
      },
    });

    srcStack.addDependency(destStack);

    const template = Template.fromStack(srcStack);

    test(`S3 Bucket created with ReplicationConfiguration Rule SourceSelectionCriteria SseKmsEncryptedObjects Status ${expected}`, () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ReplicationConfiguration: {
          Role: Match.anyValue(),
          Rules: [
            {
              Destination: {
                Bucket: Match.anyValue(),
              },
              SourceSelectionCriteria: {
                SseKmsEncryptedObjects: {
                  Status: expected,
                },
              },
              Status: 'Enabled',
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('IAM Role Created', () => {
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

    test('IAM Policy Created', () => {
      template.resourceCountIs('AWS::IAM::Policy', 1);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('Bucket'),
                  'Arn',
                ],
              },
        
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('Bucket'),
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: Match.anyValue(),
            },
          ],
        },
      });
    });
  });

  describe.each([
    {status: true, expected: 'Enabled'},
    {status: false, expected: 'Disabled'},
  ])('ReplicationProps.replicationConfiguration.rules[].status is $status', ({status, expected}) => {
    const app = new cdk.App();

    const destStack = new cdk.Stack(app, 'S3ReplicationDestStack', {
      env: {
        account: '000000000000',
        region: 'us-east-2',
      },
    });
    const destBucket = new cdkS3.Bucket(destStack, 'Bucket', {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      versioned: true,
    });
  
    const srcStack = new cdk.Stack(app, 'S3ReplicationSrcStack', {
      env: {
        account: '000000000000',
        region: 'us-east-1',
      },
    });
    new myS3.Replication(srcStack, 'S3Replication', {
      replicationConfiguration: {
        rules: [
          {
            destination: {
              bucket: destBucket,
            },
            status: status,
          },
        ],
      },
    });

    srcStack.addDependency(destStack);

    const template = Template.fromStack(srcStack);

    test(`S3 Bucket created with ReplicationConfiguration Rule Status ${expected}`, () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ReplicationConfiguration: {
          Role: Match.anyValue(),
          Rules: [
            {
              Destination: {
                Bucket: Match.anyValue(),
              },
              Status: expected,
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('IAM Role Created', () => {
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

    test('IAM Policy Created', () => {
      template.resourceCountIs('AWS::IAM::Policy', 1);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('Bucket'),
                  'Arn',
                ],
              },
        
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('Bucket'),
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: Match.anyValue(),
            },
          ],
        },
      });
    });
  });

  describe.each([
    {countRules: 1},
    {countRules: 2},
  ])('Count of ReplicationProps.replicationConfiguration.rules is $countRules', ({countRules}) => {
    const app = new cdk.App();

    const destStack = new cdk.Stack(app, 'S3ReplicationDestStack', {
      env: {
        account: '000000000000',
        region: 'us-east-2',
      },
    });
    const destBucket = new cdkS3.Bucket(destStack, 'Bucket', {
        bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
        versioned: true,
    });
  
    const srcStack = new cdk.Stack(app, 'S3ReplicationSrcStack', {
      env: {
        account: '000000000000',
        region: 'us-east-1',
      },
    });
    new myS3.Replication(srcStack, 'S3Replication', {
      replicationConfiguration: {
        rules: Array(countRules).fill(0).map((value, index) => ({
          destination: {
            bucket: destBucket,
          },
          status: true,
          prefix: `${index}`,
        })),
      },
    });

    srcStack.addDependency(destStack);

    const template = Template.fromStack(srcStack);

    test(`S3 Bucket created with ReplicationConfiguration ${countRules} rules`, () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ReplicationConfiguration: {
          Role: Match.anyValue(),
          Rules: Array(countRules).fill(0).map(value => ({
            Destination: {
              Bucket: Match.anyValue(),
            },
            Status: 'Enabled',
          })),
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('IAM Role Created', () => {
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

    test('IAM Policy Created', () => {
      template.resourceCountIs('AWS::IAM::Policy', 1);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('Bucket'),
                  'Arn',
                ],
              },
        
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('Bucket'),
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: Match.anyValue(),
            },
          ],
        },
      });
    });
  });
});
