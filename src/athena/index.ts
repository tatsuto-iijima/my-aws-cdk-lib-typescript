import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as athena from 'aws-cdk-lib/aws-athena';
/**
 * Properties for defining a `WorkGroup`
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-workgroup.html
 */
export interface WorkGroupProps {
  /**
   * The workgroup description.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-workgroup.html#cfn-athena-workgroup-description
   */
  readonly description?: string;
  /**
   * The workgroup name.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-workgroup.html#cfn-athena-workgroup-name
   */
  name?: string;
  /**
   * The option to delete a workgroup and its contents even if the workgroup contains any named queries.
   * The default is false.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-workgroup.html#cfn-athena-workgroup-recursivedeleteoption
   */
  readonly recursiveDeleteOption?: boolean;
  /**
   * The state of the workgroup: ENABLED or DISABLED.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-workgroup.html#cfn-athena-workgroup-state
   */
  readonly state?: boolean;
  /**
   * The tags (key-value pairs) to associate with this resource.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-workgroup.html#cfn-athena-workgroup-tags
   */
  readonly tags?: Array<cdk.CfnTag>;
  /**
   * The configuration of the workgroup, which includes the location in Amazon S3 where query results are stored, the encryption option, if any, used for query results, whether Amazon CloudWatch Metrics are enabled for the workgroup, and the limit for the amount of bytes scanned (cutoff) per query, if it is specified.
   * The `EnforceWorkGroupConfiguration` option determines whether workgroup settings override client-side query settings.
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-workgroup.html#cfn-athena-workgroup-workgroupconfiguration
   */
  readonly workGroupConfiguration?: athena.CfnWorkGroup.WorkGroupConfigurationProperty;
}
/**
 * The AWS::Athena::WorkGroup resource specifies an Amazon Athena workgroup, which contains a name, description, creation time, state, and other configuration, listed under `WorkGroupConfiguration` .
 * Each workgroup enables you to isolate queries for you or your group from other queries in the same account. For more information, see [CreateWorkGroup](https://docs.aws.amazon.com/athena/latest/APIReference/API_CreateWorkGroup.html) in the *Amazon Athena API Reference* .
 *
 * Error on cdk destroy, if it is not empty, it can not be deleted.
 * Manually deleted to work around but not sure why (no error when manually deleting)
 * Maybe the location bucket needs to be deleted first.
 *
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-workgroup.html
 */
export class WorkGroup extends cdk.Resource {
  private readonly _resource: athena.CfnWorkGroup;
  readonly name: string;

  constructor(scope: Construct, id: string, props?: WorkGroupProps) {
    super(scope, id, {
      physicalName: props?.name ?? cdk.Lazy.string({
        produce: () => cdk.Names.uniqueResourceName(this, { maxLength: 128 })
      }),
    });

    this._resource = new athena.CfnWorkGroup(this, 'Resource', {
      ...props,
      name: this.physicalName,
      state: props?.state !== undefined ? props.state ? 'Enabled' : 'Disabled' : undefined,
    });
    
    this.name = this._resource.name;
  }
}
