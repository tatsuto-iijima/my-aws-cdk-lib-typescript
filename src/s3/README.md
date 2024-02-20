# Amazon S3 Construct Library

The `my-aws-cdk-lib/s3` package contains primitives for setting up s3.

```ts
import * as myS3 from 'my-aws-cdk-lib/s3';
```

## Replicating objects

Configuration for replicating objects in an S3 bucket.

```ts
declare const destBucket: s3.Bucket;

const srcBucket = new myS3.Replication(this, 'Replication', {
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
```
