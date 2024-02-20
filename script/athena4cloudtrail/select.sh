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

aws athena start-query-execution \
  --work-group $WORK_GROUP \
  --query-execution-context Database=$DB_NAME \
  --query-string \
" \
SELECT * \
FROM cloudtrail_logs_${BUCKET//-/_} \
WHERE eventSource = 's3.amazonaws.com' \
ORDER BY eventTime \
"
