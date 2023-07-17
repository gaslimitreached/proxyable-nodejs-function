import { Annotations } from 'aws-cdk-lib';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { IDatabaseProxy } from 'aws-cdk-lib/aws-rds';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface ProxyableNodejsFunctionProps extends NodejsFunctionProps {
  readonly database?: string | undefined;
  readonly username?: string | undefined;
  readonly proxy?: IDatabaseProxy | undefined;
  readonly secret?: ISecret | undefined;
}

export class ProxyableNodejsFunction extends NodejsFunction {
  constructor(scope: Construct, id: string, props: ProxyableNodejsFunctionProps) {

    const environment = props && props.proxy == undefined
      ? props.environment
      : {
        DATABASE_NAME: props.database as string,
        POSTGRES_URL: props.proxy!.endpoint as string,
        POSTGRES_USER: props.username as string,
        PROXY_NAME: props.proxy!.dbProxyName as string,
        PROXY_ARN: props.proxy!.dbProxyArn as string,
        POSTGRES_SECRET_NAME: props.secret!.secretFullArn as string,
        ...props.environment,
      };

    super(scope, id, {
      environment,
      vpc: props.vpc,
      vpcSubnets: props.vpc ? props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }) : undefined,
      ...props as NodejsFunctionProps,
    });

    // grant connect to proxy if exists
    props && props.secret
      ? props.secret.grantRead(this.role!)
      : Annotations.of(this).addInfo('No secret to grant read');

    // grant connect as username to proxy if it exists
    props && props.proxy
      ? props.proxy.grantConnect(this.role!, props.username!)
      : Annotations.of(this).addInfo('No proxy to grant connect');
  }
}
