# Proxyable Nodejs Function (AWS-CDK)

Simple wrapper around `@aws-cdk-lib` `NodejsFunction` that configures an RDS
proxy. See the unit test for an example of how to create the necessary
resources.

```typescript
import { Credentials, DatabaseInstance } from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

import { Construct } from 'constructs';

import { ProxyableNodejsFunction } from '../src';

class MyStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      // Database, secret, and proxy setup...

      new ProxyableNodejsFunction(this, 'ProxiedFunction', {
        entry: join(__dirname, 'index.ts'),
        vpc,
        proxy,
        secret,
        database: 'test',
        username: 'testuser',
      });
    }
}
```
