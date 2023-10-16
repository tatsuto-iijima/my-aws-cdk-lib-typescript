# My AWS CDK Library

This is a library that extends the AWS CDK Library.

## Usage

### Installation

To use this package, you need to install this package.

```shell
npm install my-aws-cdk-lib
```

### Use in your code

#### Classic import

You can use a classic import to get access to each service namespaces:

```ts nofixture
import { ec2_construct as myEc2 } from 'my-aws-cdk-lib';

const app = new App();
const stack = new Stack(app, 'TestStack');

new myEc2.Instances(stack, 'TestInstances', {
    ...
});
```
