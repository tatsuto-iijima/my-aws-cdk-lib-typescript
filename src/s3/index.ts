import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface ReplicationProps {
  readonly bucketProperty?: s3.BucketProps;
  readonly replicationConfiguration: ReplicationConfiguration;
}
/**
 * A container for replication rules.
 * You can add up to 1,000 rules. The maximum size of a replication configuration is 2 MB.
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationconfiguration.html
 */
export interface ReplicationConfiguration {
  /**
   * A container for one or more replication rules.
   * A replication configuration must have at least one rule and can contain a maximum of 1,000 rules.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationconfiguration.html#cfn-s3-bucket-replicationconfiguration-rules
   */
  readonly rules: ReplicationRule[];
  /**
   * The AWS Identity and Access Management (IAM) role that Amazon S3 assumes when replicating objects.
   * For more information, see [How to Set Up Replication](https://docs.aws.amazon.com/AmazonS3/latest/dev/replication-how-setup.html) in the *Amazon S3 User Guide* .
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationconfiguration.html#cfn-s3-bucket-replicationconfiguration-role
   */
  readonly role?: iam.IRole;
}
/**
 * Specifies which Amazon S3 objects to replicate and where to store the replicas.
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationrule.html
 */
export interface ReplicationRule {
  /**
   * Specifies whether Amazon S3 replicates delete markers.
   * If you specify a `Filter` in your replication configuration, you must also include a `DeleteMarkerReplication` element. If your `Filter` includes a `Tag` element, the `DeleteMarkerReplication` `Status` must be set to Disabled, because Amazon S3 does not support replicating delete markers for tag-based rules. For an example configuration, see [Basic Rule Configuration](https://docs.aws.amazon.com/AmazonS3/latest/dev/replication-add-config.html#replication-config-min-rule-config) .
   * For more information about delete marker replication, see [Basic Rule Configuration](https://docs.aws.amazon.com/AmazonS3/latest/dev/delete-marker-replication.html) .
   * > If you are using an earlier version of the replication configuration, Amazon S3 handles replication of delete markers differently. For more information, see [Backward Compatibility](https://docs.aws.amazon.com/AmazonS3/latest/dev/replication-add-config.html#replication-backward-compat-considerations) .
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationrule.html#cfn-s3-bucket-replicationrule-deletemarkerreplication
   */
  readonly deleteMarkerReplication?: DeleteMarkerReplication;
  /**
   * A container for information about the replication destination and its configurations including enabling the S3 Replication Time Control (S3 RTC).
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationrule.html#cfn-s3-bucket-replicationrule-destination
   */
  readonly destination: ReplicationDestination;
  /**
   * A filter that identifies the subset of objects to which the replication rule applies.
   * A `Filter` must specify exactly one `Prefix` , `TagFilter` , or an `And` child element. The use of the filter field indicates that this is a V2 replication configuration. This field isn't supported in a V1 replication configuration.
   * > V1 replication configuration only supports filtering by key prefix. To filter using a V1 replication configuration, add the `Prefix` directly as a child element of the `Rule` element.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationrule.html#cfn-s3-bucket-replicationrule-filter
   */
  readonly filter?: s3.CfnBucket.ReplicationRuleFilterProperty;
  /**
   * A unique identifier for the rule.
   * The maximum value is 255 characters. If you don't specify a value, AWS CloudFormation generates a random ID. When using a V2 replication configuration this property is capitalized as "ID".
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationrule.html#cfn-s3-bucket-replicationrule-id
   */
  readonly id?: string;
  /**
   * An object key name prefix that identifies the object or objects to which the rule applies.
   * The maximum prefix length is 1,024 characters. To include all objects in a bucket, specify an empty string. To filter using a V1 replication configuration, add the `Prefix` directly as a child element of the `Rule` element.
   * > Replacement must be made for object keys containing special characters (such as carriage returns) when using XML requests. For more information, see [XML related object key constraints](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html#object-key-xml-related-constraints) .
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationrule.html#cfn-s3-bucket-replicationrule-prefix
   */
  readonly prefix?: string;
  /**
   * The priority indicates which rule has precedence whenever two or more replication rules conflict.
   * Amazon S3 will attempt to replicate objects according to all replication rules. However, if there are two or more rules with the same destination bucket, then objects will be replicated according to the rule with the highest priority. The higher the number, the higher the priority.
   * For more information, see [Replication](https://docs.aws.amazon.com/AmazonS3/latest/dev/replication.html) in the *Amazon S3 User Guide* .
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationrule.html#cfn-s3-bucket-replicationrule-priority
   */
  readonly priority?: number;
  /**
   * A container that describes additional filters for identifying the source objects that you want to replicate.
   * You can choose to enable or disable the replication of these objects.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationrule.html#cfn-s3-bucket-replicationrule-sourceselectioncriteria
   */
  readonly sourceSelectionCriteria?: SourceSelectionCriteria;
  /**
   * Specifies whether the rule is enabled.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationrule.html#cfn-s3-bucket-replicationrule-status
   */
  readonly status: boolean;
}
/**
 * Specifies whether Amazon S3 replicates delete markers.
 * If you specify a `Filter` in your replication configuration, you must also include a `DeleteMarkerReplication` element. If your `Filter` includes a `Tag` element, the `DeleteMarkerReplication` `Status` must be set to Disabled, because Amazon S3 does not support replicating delete markers for tag-based rules. For an example configuration, see [Basic Rule Configuration](https://docs.aws.amazon.com/AmazonS3/latest/dev/replication-add-config.html#replication-config-min-rule-config) .
 * For more information about delete marker replication, see [Basic Rule Configuration](https://docs.aws.amazon.com/AmazonS3/latest/dev/delete-marker-replication.html) .
 * > If you are using an earlier version of the replication configuration, Amazon S3 handles replication of delete markers differently. For more information, see [Backward Compatibility](https://docs.aws.amazon.com/AmazonS3/latest/dev/replication-add-config.html#replication-backward-compat-considerations) .
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-deletemarkerreplication.html
 */
export interface DeleteMarkerReplication {
  /**
   * Indicates whether to replicate delete markers.
   * Disabled by default.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-deletemarkerreplication.html#cfn-s3-bucket-deletemarkerreplication-status
   */
  readonly status?: boolean;
}
/**
 * A container for information about the replication destination and its configurations including enabling the S3 Replication Time Control (S3 RTC).
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationdestination.html
 */
export interface ReplicationDestination {
  /**
   * Specify this only in a cross-account scenario (where source and destination bucket owners are not the same), and you want to change replica ownership to the AWS account that owns the destination bucket.
   * If this is not specified in the replication configuration, the replicas are owned by same AWS account that owns the source object.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationdestination.html#cfn-s3-bucket-replicationdestination-accesscontroltranslation
   */
  readonly accessControlTranslation?: s3.CfnBucket.AccessControlTranslationProperty;
  /**
   * Destination bucket owner account ID.
   * In a cross-account scenario, if you direct Amazon S3 to change replica ownership to the AWS account that owns the destination bucket by specifying the `AccessControlTranslation` property, this is the account ID of the destination bucket owner. For more information, see [Cross-Region Replication Additional Configuration: Change Replica Owner](https://docs.aws.amazon.com/AmazonS3/latest/dev/crr-change-owner.html) in the *Amazon S3 User Guide* .
   * If you specify the `AccessControlTranslation` property, the `Account` property is required.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationdestination.html#cfn-s3-bucket-replicationdestination-account
   */
  readonly account?: string;
  /**
   * The bucket where you want Amazon S3 to store the results.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationdestination.html#cfn-s3-bucket-replicationdestination-bucket
   */
  readonly bucket: s3.IBucket;
  /**
   * A container specifying replication metrics-related settings enabling replication metrics and events.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationdestination.html#cfn-s3-bucket-replicationdestination-metrics
   */
  readonly metrics?: Metrics;
  /**
   * A container specifying S3 Replication Time Control (S3 RTC), including whether S3 RTC is enabled and the time when all objects and operations on objects must be replicated.
   * Must be specified together with a `Metrics` block.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationdestination.html#cfn-s3-bucket-replicationdestination-replicationtime
   */
  readonly replicationTime?: ReplicationTime;
  /**
   * The storage class to use when replicating objects, such as S3 Standard or reduced redundancy.
   * By default, Amazon S3 uses the storage class of the source object to create the object replica.
   * For valid values, see the `StorageClass` element of the [PUT Bucket replication](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTBucketPUTreplication.html) action in the *Amazon S3 API Reference* .
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationdestination.html#cfn-s3-bucket-replicationdestination-storageclass
   */
  readonly storageClass?: s3.StorageClass;
}
/**
 * A container specifying replication metrics-related settings enabling replication metrics and events.
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-metrics.html
 */
export interface Metrics {
  /**
   * Specifies whether the replication metrics are enabled.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-metrics.html#cfn-s3-bucket-metrics-status
   */
  readonly status: boolean;
}
/**
 * A container specifying S3 Replication Time Control (S3 RTC) related information, including whether S3 RTC is enabled and the time when all objects and operations on objects must be replicated.
 * Must be specified together with a `Metrics` block.
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationtime.html
 */
export interface ReplicationTime {
  /**
   * Specifies whether the replication time is enabled.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicationtime.html#cfn-s3-bucket-replicationtime-status
   */
  readonly status: boolean;
}
/**
 * A container that describes additional filters for identifying the source objects that you want to replicate.
 * You can choose to enable or disable the replication of these objects.
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-sourceselectioncriteria.html
 */
export interface SourceSelectionCriteria {
  /**
   * A filter that you can specify for selection for modifications on replicas.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-sourceselectioncriteria.html#cfn-s3-bucket-sourceselectioncriteria-replicamodifications
   */
  readonly replicaModifications?: ReplicaModifications;
  /**
   * A container for filter information for the selection of Amazon S3 objects encrypted with AWS KMS.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-sourceselectioncriteria.html#cfn-s3-bucket-sourceselectioncriteria-ssekmsencryptedobjects
   */
  readonly sseKmsEncryptedObjects?: SseKmsEncryptedObjects;
}
/**
 * A filter that you can specify for selection for modifications on replicas.
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicamodifications.html
 */
export interface ReplicaModifications {
  /**
   * Specifies whether Amazon S3 replicates modifications on replicas.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-replicamodifications.html#cfn-s3-bucket-replicamodifications-status
   */
  readonly status: boolean;
}
/**
 * A container for filter information for the selection of S3 objects encrypted with AWS KMS.
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-ssekmsencryptedobjects.html
 */
export interface SseKmsEncryptedObjects {
  /**
   * Specifies whether Amazon S3 replicates objects created with server-side encryption using an AWS KMS key stored in AWS Key Management Service.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-ssekmsencryptedobjects.html#cfn-s3-bucket-ssekmsencryptedobjects-status
   */
  readonly status: boolean;
}
/**
 * Construct replicating objects the AWS S3 bucket.
 */
export class Replication extends Construct {
  readonly bucket: s3.Bucket;
  /**
   * The AWS IAM Role construct specified in the replicating objects configuration.
   */
  readonly role?: iam.Role;
  private _role: iam.Role | iam.IRole;

  constructor(scope: Construct, id: string, props: ReplicationProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Bucket', {
      ...props.bucketProperty,
      versioned: true,  // VersionConfiguration must be enabled for ReplicationConfiguration
    });

    if (!props.replicationConfiguration.role) {
      const destBuckets = new Set(props.replicationConfiguration.rules.map(rule => rule.destination.bucket));
      this.role = this.createRoleForReplication(this.bucket, [...destBuckets]);
      this._role = this.role;
    } else {
      this._role = props.replicationConfiguration.role;
    }

    const cfnBucket = this.bucket.node.defaultChild as s3.CfnBucket;  // Typescript will give an error if you don't make type assertions.
    const convertedRules = this.convertRules(props.replicationConfiguration.rules);
    cfnBucket.replicationConfiguration = {
      role: this._role.roleArn,
      rules: convertedRules,
    };
  }

  private createRoleForReplication = (srcBucket: s3.Bucket, destBuckets: s3.IBucket[]) => {
    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
    });

    role.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:GetReplicationConfiguration',
        's3:ListBucket',
      ],
      resources: [
        srcBucket.bucketArn,
      ],
    }));

    role.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObjectVersionForReplication',
        's3:GetObjectVersionAcl',
        's3:GetObjectVersionTagging',
      ],
      resources: [
        `${srcBucket.bucketArn}/*`,
      ],
    }));

    role.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:ReplicateObject',
        's3:ReplicateDelete',
        's3:ReplicateTags',
      ],
      resources: destBuckets.map(bucket => `${bucket.bucketArn}/*`),
    }));

    return role;
  }

  private convertRules = (rules: ReplicationRule[]): s3.CfnBucket.ReplicationRuleProperty[] => {
    const convertedRules = rules.map(rule => {
      const {
        deleteMarkerReplication,
        destination,
        sourceSelectionCriteria,
        status,
        ...others
      } = rule;

      const convertedDeleteMarkerReplication = deleteMarkerReplication !== undefined ? {
        status: deleteMarkerReplication.status !== undefined ? deleteMarkerReplication.status ? 'Enabled' : 'Disabled' : undefined,
      } : undefined;

      const convertedDestination = {
        ...destination,
        bucket: destination.bucket.bucketArn,
        metrics: destination.metrics !== undefined ? {
          status: destination.metrics.status ? 'Enabled' : 'Disabled',
        } : undefined,
        replicationTime: destination.replicationTime !== undefined ? {
          status: destination.replicationTime.status ? 'Enabled' : 'Disabled',
          time: {
            minutes: 15,
          },
        } : undefined,
        storageClass: destination.storageClass !== undefined ? destination.storageClass.toString() : undefined,
      };

      const converedSourceSelectionCriteria = sourceSelectionCriteria !== undefined ? {
        replicaModifications: sourceSelectionCriteria.replicaModifications !== undefined ? {
          status: sourceSelectionCriteria.replicaModifications.status ? 'Enabled' : 'Disabled',
        } : undefined,
        sseKmsEncryptedObjects: sourceSelectionCriteria.sseKmsEncryptedObjects !== undefined ? {
          status: sourceSelectionCriteria.sseKmsEncryptedObjects.status ? 'Enabled' : 'Disabled',
        } : undefined,
      } : undefined;

      const convertedStatus = status ? 'Enabled' : 'Disabled';
       
      return {
        ...others,
        deleteMarkerReplication: convertedDeleteMarkerReplication,
        destination: convertedDestination,
        sourceSelectionCriteria: converedSourceSelectionCriteria,
        status: convertedStatus,
      }
    });

    return convertedRules;
  }
}
