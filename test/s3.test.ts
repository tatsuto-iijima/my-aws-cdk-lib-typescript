import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import * as fs from 'fs';

const stacks = [
  {
    name: 'TrialS3ReplicationSrcStack',
    region: 'ap-northeast-1',
    type: 'src',
  },
  {
    name: 'TrialS3ReplicationDest1Stack',
    region: 'ap-northeast-3',
    type: 'dest',
  },
  {
    name: 'TrialS3ReplicationDest2Stack',
    region: 'ap-northeast-2',
    type: 'dest',
  },
  {
    name: 'TrialS3ReplicationDest3Stack',
    region: 'ap-southeast-2',
    type: 'dest',
  },
  {
    name: 'TrialS3ReplicationDest4Stack',
    region: 'eu-central-1',
    type: 'dest',
  },
  {
    name: 'TrialS3ReplicationDest5Stack',
    region: 'us-east-1',
    type: 'dest',
  },
  {
    name: 'TrialS3ReplicationDest6Stack',
    region: 'af-south-1',
    type: 'dest',
  },
  {
    name: 'TrialS3ReplicationDest7Stack',
    region: 'sa-east-1',
    type: 'dest',
  },
];

const testBucketKey = 'README.md';
// const testBucketKey = 'test-1kb.txt';
// const testBucketKey = 'test-5mb.bin';

let srcBucket: {
  name: string;
  region: string;
};
let destBuckets: {
  name: string;
  region: string;
}[] = [];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(async() => {
  const responses = await Promise.all(stacks.map(async stack => {
    const client = new CloudFormationClient({
      region: stack.region,
          });
    const input = {
      StackName: stack.name,
    };
    const command = new DescribeStacksCommand(input);
    const response = await client.send(command);
    return {
      bucketName: response.Stacks?.at(-1)?.Outputs?.find(output => output.OutputKey === 'BucketName')?.OutputValue ?? undefined,
      region: stack.region,
      type: stack.type,
    };
  }));

  for (const response of responses) {
    if (!response.bucketName) throw new Error('Unexpected erro.');
    if (response.type === 'src') {
      srcBucket = {
        name: response.bucketName,
        region: response.region,
      };
    } else if (response.type === 'dest') {
      destBuckets = [
        ...destBuckets,
        {
          name: response.bucketName,
          region: response.region,
        },
      ];
    }
  }
}, 180000);

afterAll(async() => {
  const client = new S3Client({
    region: srcBucket.region,
  });
  const input = {
    Bucket: srcBucket.name,
    Key: testBucketKey,
  };
  const command = new DeleteObjectCommand(input);
  await client.send(command);
}, 180000);

test('test', async() => {
  const fileStream = fs.createReadStream(`./${testBucketKey}`);
  const srcClient = new S3Client({
    region: srcBucket.region,
  });
  const srcInput = {
    Bucket: srcBucket.name,
    Key: testBucketKey,
    Body: fileStream,
  };
  const srcCommand = new PutObjectCommand(srcInput);
  await srcClient.send(srcCommand);

  const results = await Promise.all(destBuckets.map(async bucket => {
    let result;
    const destClient = new S3Client({
      region: bucket.region,
    });
    const destInput = {
      Bucket: bucket.name,
    };
    const destCommand = new ListObjectsV2Command(destInput);
    for (let count = 0; count < 30; count++) {
      try {
        const destResponse = await destClient.send(destCommand);
        result = destResponse.Contents?.filter(content => content.Key === testBucketKey);
      } catch (error) {
        console.log(error);
      }
      if (result && result.length > 0) {
        break;
      } else {
        await sleep(30000);
      }
    }
    return result;
  }));
  expect(results).toMatchObject([
    [{Key: testBucketKey}],
    [{Key: testBucketKey}],
    [{Key: testBucketKey}],
    [{Key: testBucketKey}],
    [{Key: testBucketKey}],
    [{Key: testBucketKey}],
    [{Key: testBucketKey}],
  ]);
}, 1000000);
