import { join } from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InstanceClass, InstanceSize, InstanceType, Port, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

import { Construct } from 'constructs';
import { ProxyableNodejsFunction } from '../src';

describe('ProxyableNodejsFunction default', () => {
  const app = new cdk.App();

  class TestStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);
      new ProxyableNodejsFunction(this, 'DefaultFunction', {
        entry: join(__dirname, 'index.ts'),
      });
    }
  }

  const stack = new TestStack(app, 'TestStack', {});

  const template = Template.fromStack(stack);

  test('Creates resource', () => {
    template.resourceCountIs('AWS::Lambda::Function', 1);
  });
});

describe('ProxyableNodejsFunction with proxy', () => {
  const app = new cdk.App();

  class TestStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      const vpc = new Vpc(this, 'TestVpc');

      const secret = new Secret(this, `${id}DbCredentials`, {
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'testuser' }),
          excludePunctuation: true,
          includeSpace: false,
          generateStringKey: 'password',
        },
      });

      const db = new DatabaseInstance(this, 'TestPostgresInstance', {
        credentials: Credentials.fromSecret(secret),
        databaseName: 'test',
        engine: DatabaseInstanceEngine.postgres({
          version: PostgresEngineVersion.VER_15,
        }),
        instanceType: InstanceType.of(
          InstanceClass.BURSTABLE2,
          InstanceSize.SMALL,
        ),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        vpc,
      });

      const lambdaSecurityGroup = new SecurityGroup(this, `${id}LambdaProxyGroup`, {
        vpc,
      });

      const connectionGroup = new SecurityGroup(this, `${id}DbConnGroup`, {
        vpc,
      });

      connectionGroup.addIngressRule(
        connectionGroup,
        Port.tcp(5432),
        'Allow db connections',
      );

      connectionGroup.addIngressRule(
        lambdaSecurityGroup,
        Port.tcp(5432),
        'Allow lambda proxy connections',
      );


      const proxy = db.addProxy('TestProxy', {
        secrets: [db.secret!],
        securityGroups: [connectionGroup],
        iamAuth: false,
        vpc,
      });

      new ProxyableNodejsFunction(this, 'DefaultFunction', {
        entry: join(__dirname, 'index.ts'),
        vpc,
        proxy,
        secret,
        database: 'test',
        username: 'testuser',
      });
    }
  }

  const stack = new TestStack(app, 'TestStack', {});

  const template = Template.fromStack(stack);

  test('Creates resource', () => {
    template.resourceCountIs('AWS::Lambda::Function', 1);
  });
});
