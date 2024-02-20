#!/bin/bash

JSON=$1

cat $JSON | jq -r '.ResultSet.Rows[] | [ .Data[].VarCharValue ] | @csv'
