#!/bin/bash

PROFILE=default
OUTPUT_KEY_BUCKET=S3BucketName
OUTPUT_KEY_WORKGP=AthenaWorkGroupName
DB_NAME=s3_replication

while (( $# > 0 ))
do
  case $1 in
    --profile)
      PROFILE=$2
      ;;
    --stack-name)
      STACK_NAME=$2
      ;;
  esac
  shift
done

if [ -z "$STACK_NAME" ]; then
  echo "Error: No specified --stack-name" 1>&2
  exit 1
fi

BUCKET=` \
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[].Outputs[?OutputKey=='$OUTPUT_KEY_BUCKET'].[OutputValue]" \
  --profile $PROFILE \
  --output text \
`

WORK_GROUP=` \
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[].Outputs[?OutputKey=='$OUTPUT_KEY_WORKGP'].[OutputValue]" \
  --profile $PROFILE \
  --output text \
`

ACCOUNT=` \
aws sts get-caller-identity \
  --query 'Account' \
  --profile $PROFILE \
  --output text \
`

aws athena start-query-execution \
  --work-group $WORK_GROUP \
  --query-execution-context Database=$DB_NAME \
  --query-string \
" \
CREATE EXTERNAL TABLE cloudtrail_logs_${BUCKET//-/_} ( \
  eventVersion STRING, \
  userIdentity STRUCT< \
    type: STRING, \
    principalId: STRING, \
    arn: STRING, \
    accountId: STRING, \
    invokedBy: STRING, \
    accessKeyId: STRING, \
    userName: STRING, \
    sessionContext: STRUCT< \
      attributes: STRUCT< \
        mfaAuthenticated: STRING, \
        creationDate: STRING>, \
      sessionIssuer: STRUCT< \
        type: STRING, \
        principalId: STRING, \
        arn: STRING, \
        accountId: STRING, \
        username: STRING>, \
      ec2RoleDelivery: STRING, \
      webIdFederationData: MAP<STRING,STRING>>>, \
  eventTime STRING, \
  eventSource STRING, \
  eventName STRING, \
  awsRegion STRING, \
  sourceIpAddress STRING, \
  userAgent STRING, \
  errorCode STRING, \
  errorMessage STRING, \
  requestParameters STRING, \
  responseElements STRING, \
  additionalEventData STRING, \
  requestId STRING, \
  eventId STRING, \
  resources ARRAY<STRUCT< \
    arn: STRING, \
    accountId: STRING, \
    type: STRING>>, \
  eventType STRING, \
  apiVersion STRING, \
  readOnly STRING, \
  recipientAccountId STRING, \
  serviceEventDetails STRING, \
  sharedEventID STRING, \
  vpcEndpointId STRING, \
  tlsDetails STRUCT< \
    tlsVersion: STRING, \
    cipherSuite: STRING, \
    clientProvidedHostHeader: STRING> \
) \
COMMENT 'CloudTrail table for $BUCKET bucket' \
ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe' \
STORED AS INPUTFORMAT 'com.amazon.emr.cloudtrail.CloudTrailInputFormat' \
OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat' \
LOCATION 's3://$BUCKET/AWSLogs/$ACCOUNT/CloudTrail/' \
TBLPROPERTIES ('classification'='cloudtrail') \
"
