import * as cdk from 'aws-cdk-lib';
import * as cdkS3 from 'aws-cdk-lib/aws-s3';
import * as myS3 from 'my-aws-cdk-lib/s3';

export interface ReplicationDestStackProps extends cdk.StackProps {
  readonly bucket: cdkS3.BucketProps,
}

export class ReplicationDestStack extends cdk.Stack {
  readonly bucket: cdkS3.Bucket;

  constructor(scope: cdk.App, id: string, props: ReplicationDestStackProps) {
    super(scope, id, props);

    this.bucket = new cdkS3.Bucket(this, 'Bucket', {
      ...props.bucket,
      versioned: true,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
    });
  }
}

export interface ReplicationSrcStackProps extends cdk.StackProps {
  readonly replicatingObjects: myS3.ReplicationProps,
}

export class ReplicationSrcStack extends cdk.Stack {
  readonly bucket: cdkS3.Bucket;

  constructor(scope: cdk.App, id: string, props: ReplicationSrcStackProps) {
    super(scope, id, props);

    const replication = new myS3.Replication(this, 'S3Replication', props.replicatingObjects);
    
    this.bucket = replication.bucket;

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
    });
  }
}
