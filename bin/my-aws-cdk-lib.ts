#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyEc2InstancesStack } from '../lib/my-ec2-instances-stack';

const app = new cdk.App();
new MyEc2InstancesStack(app, 'MyEc2InstancesTestStack');
