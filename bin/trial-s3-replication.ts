#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as s3Stack from '../lib/s3-stack';

const app = new cdk.App();

const s3ReplicationDestStacks = [
  'us-east-2',
  'us-west-1',
].map((region, index) => new s3Stack.ReplicationDestStack(app, `TrialS3ReplicationDest${index + 1}Stack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
  bucket: {
    bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
    // versioned: true,  /** default */
    autoDeleteObjects: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  },
}));

const s3ReplicationSrcStack = new s3Stack.ReplicationSrcStack(app, 'TrialS3ReplicationSrcStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  replicatingObjects: {
    replicationConfiguration: {
      rules: s3ReplicationDestStacks.map((stack, index) => ({
        destination: {
          bucket: stack.bucket,
        },
        status: true,
        /**
         * Due to CloudFormation specifications, if multiple rules are configured, the id must be set.
         */
        id: `Rule${index + 1}`,
        /**
         * AWS S3 stores Replication configuration as XML. And the latest version of the schema is V2. Although, AWS keeps supporting V1 for backward compatibility.
         * In order for multiple destinations to work, you must force ReplicationRules to use the V2 schema.
         * The use of the filter field indicates this is a V2 replication configuration. V1 does not have this field.
         * Now as per the syntax, “If you specify Filter elements, you must also include Priority and DeleteMarkerReplication elements.
         */
        filter: {},
        priority: index,
        deleteMarkerReplication: {
          status: true,
        },
      })),
    },
    bucketProperty: {
      // versioned: true,  /** default */
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    },
  },
});

s3ReplicationDestStacks.forEach(stack => s3ReplicationSrcStack.addDependency(stack));
