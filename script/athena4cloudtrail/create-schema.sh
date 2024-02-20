#!/bin/bash

PROFILE=default
OUTPUT_KEY=AthenaWorkGroupName
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

WORK_GROUP=` \
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[].Outputs[?OutputKey=='$OUTPUT_KEY'].[OutputValue]" \
  --profile $PROFILE \
  --output text \
`

aws athena start-query-execution \
  --work-group $WORK_GROUP \
  --query-string "CREATE SCHEMA $DB_NAME"
