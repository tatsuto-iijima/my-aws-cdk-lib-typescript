import * as cdk from 'aws-cdk-lib';
import * as cdkS3 from 'aws-cdk-lib/aws-s3';
import * as cdkCloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as myAthena from 'my-aws-cdk-lib/athena';

export interface S3EventLoggingTrailStackProps extends cdk.StackProps {
  readonly bucket?: cdkS3.BucketProps;
  readonly cloudtrail?: cdkCloudtrail.TrailProps;
}

export class S3EventLoggingTrailStack extends cdk.Stack {
  readonly bucket: cdkS3.Bucket;
  readonly cloudtrail: cdkCloudtrail.Trail;
  private _workGroup: myAthena.WorkGroup;

  constructor(scope: cdk.App, id: string, props?: S3EventLoggingTrailStackProps) {
    super(scope, id, props);

    if (props?.bucket) {
      this.bucket = new cdkS3.Bucket(this, 'Bucket', props.bucket);

      new cdk.CfnOutput(this, 'S3BucketName', {
        value: this.bucket.bucketName,
      });
    }

    this.cloudtrail = new cdkCloudtrail.Trail(this, 'CloudTrail', {
      ...props?.cloudtrail,
      bucket: this.bucket ?? props?.cloudtrail?.bucket,
    });
  }
  
  public get workGroup() :myAthena.WorkGroup {
    return this._workGroup;
  }
  

  addS3EventSelectorToCloudTrail = (s3Selector: cdkCloudtrail.S3EventSelector[], options?: cdkCloudtrail.AddEventSelectorOptions) => {
    this.cloudtrail.addS3EventSelector(s3Selector, options);
  }

  addAthenaWorkGroup = (props?: myAthena.WorkGroupProps) => {
    this._workGroup = new myAthena.WorkGroup(this, 'WorkGroup', props);

    new cdk.CfnOutput(this, 'AthenaWorkGroupName', {
      value: this._workGroup.name,
    });
  }
}
