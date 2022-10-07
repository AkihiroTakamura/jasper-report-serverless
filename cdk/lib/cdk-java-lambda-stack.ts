import {
  aws_apigateway,
  aws_certificatemanager,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_iam,
  aws_route53,
  aws_route53_targets,
  aws_s3,
  CfnOutput,
  Duration,
  Stack,
  StackProps,
} from 'aws-cdk-lib'
import { Architecture, Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import { resolve } from 'path'
import { BuildConfig } from '../bin/cdk'

interface CdkJavaLambdaStackProps extends StackProps {
  config: BuildConfig
}
export class CdkJavaLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: CdkJavaLambdaStackProps) {
    super(scope, id, props)

    const rootDomain = props.config.JavaLambdaParameters.Domain
    const deployDomain = `print.${rootDomain}`

    // role for lambda jasper report
    const iamRoleForJasperLambda = new aws_iam.Role(
      this,
      'iamRoleForJasperLambda',
      {
        roleName: `${props.config.App}-lambda-java-role`,
        assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
        path: '/',
      },
    )

    // role for apigateway
    const iamRoleForApigateway = new aws_iam.Role(
      this,
      'iamRoleForApigateway',
      {
        roleName: `${props.config.App}-apigateway-role`,
        assumedBy: new aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
        path: '/',
      },
    )

    // s3 bucket for jasper templates
    const jasperBucket = new aws_s3.Bucket(this, 'template-bucket')
    jasperBucket.grantRead(iamRoleForJasperLambda)
    jasperBucket.grantReadWrite(iamRoleForApigateway)

    // lambda jasper report
    const jasperLambda = new Function(this, 'jasper-func', {
      code: Code.fromAsset(
        resolve(__dirname, '..', '..', 'app', 'target', 'lambda.jar'),
      ),
      handler: 'lambda.Report::handleRequest',
      runtime: Runtime.JAVA_11,
      logRetention: RetentionDays.ONE_WEEK,
      timeout: Duration.minutes(5),
      memorySize: 1024,
      architecture: Architecture.ARM_64,
      role: iamRoleForJasperLambda,
      environment: {
        TEMPLATE_BUCKET: jasperBucket.bucketName,
        REGION: this.region,
      },
    })

    // api gateway
    const apiGateway = new aws_apigateway.RestApi(this, 'JavaLambdaApi', {
      binaryMediaTypes: ['*/*'],
      endpointTypes: [aws_apigateway.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: aws_apigateway.Cors.ALL_ORIGINS,
        allowMethods: aws_apigateway.Cors.ALL_METHODS,
        statusCode: 200,
      },
    })

    // apikey
    const apiKey = apiGateway.addApiKey('APIKey', {
      apiKeyName: `${props.config.App}-api-key`,
    })

    const usagePlan = apiGateway.addUsagePlan('apiKeyUseagePlan')
    usagePlan.addApiKey(apiKey)
    usagePlan.addApiStage({ stage: apiGateway.deploymentStage })

    new CfnOutput(this, 'APIKeyId', {
      value: apiKey.keyId,
    })

    // handle template file by s3
    const templateResource = apiGateway.root.addResource('template')
    const templateFileResource = templateResource.addResource('{fileName}')

    templateFileResource.addMethod(
      'PUT',
      new aws_apigateway.AwsIntegration({
        service: 's3',
        integrationHttpMethod: 'PUT',
        path: `${jasperBucket.bucketName}/{object}`,
        options: {
          credentialsRole: iamRoleForApigateway,
          passthroughBehavior: aws_apigateway.PassthroughBehavior.WHEN_NO_MATCH,
          requestParameters: {
            'integration.request.header.Content-Type':
              'method.request.header.Content-Type',
            'integration.request.path.object': 'method.request.path.fileName',
          },
          integrationResponses: [
            {
              statusCode: '200',
              responseParameters: {
                'method.response.header.Timestamp':
                  'integration.response.header.Date',
                'method.response.header.Content-Length':
                  'integration.response.header.Content-Length',
                'method.response.header.Content-Type':
                  'integration.response.header.Content-Type',
                'method.response.header.Access-Control-Allow-Headers':
                  "'Content-Type,Authorization'",
                'method.response.header.Access-Control-Allow-Methods':
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
              },
            },
            {
              statusCode: '400',
              selectionPattern: '4\\d{2}',
              responseParameters: {
                'method.response.header.Access-Control-Allow-Headers':
                  "'Content-Type,Authorization'",
                'method.response.header.Access-Control-Allow-Methods':
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
              },
            },
            {
              statusCode: '500',
              selectionPattern: '5\\d{2}',
              responseParameters: {
                'method.response.header.Access-Control-Allow-Headers':
                  "'Content-Type,Authorization'",
                'method.response.header.Access-Control-Allow-Methods':
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
              },
            },
          ],
        },
      }),
      {
        requestParameters: {
          'method.request.header.Content-Type': true,
          'method.request.path.fileName': true,
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Timestamp': true,
              'method.response.header.Content-Length': true,
              'method.response.header.Content-Type': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '400',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
        apiKeyRequired: true,
      },
    )

    const reportResource = apiGateway.root.addResource('report')
    reportResource.addMethod(
      'POST',
      new aws_apigateway.LambdaIntegration(jasperLambda),
      {
        apiKeyRequired: true,
      },
    )

    // hostedzone
    const hostedZone = aws_route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: rootDomain,
    })

    // acm
    const cert = new aws_certificatemanager.DnsValidatedCertificate(
      this,
      'Certificate',
      {
        domainName: rootDomain,
        subjectAlternativeNames: [`*.${rootDomain}`],
        hostedZone,
        region: 'us-east-1',
      },
    )

    // cloudfront
    const dist = new aws_cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new aws_cloudfront_origins.HttpOrigin(
          `${apiGateway.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
          {
            customHeaders: {
              Accept:
                'application/json,application/xml,application/jrxml,application/pdf,application/octet-stream',
            },
          },
        ),
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: new aws_cloudfront.CachePolicy(
          this,
          `${props.config.App}-java-lambda-cf-cache-policy`,
          {
            defaultTtl: Duration.seconds(1),
            minTtl: Duration.seconds(1),
            maxTtl: Duration.seconds(1),
            enableAcceptEncodingBrotli: true,
            enableAcceptEncodingGzip: true,
            headerBehavior: {
              behavior: 'whitelist',
              headers: ['X-API-KEY'],
            },
          },
        ),
      },
      certificate: cert,
      domainNames: [deployDomain],
    })

    // route53
    const route = new aws_route53.ARecord(this, 'ARecord', {
      zone: hostedZone,
      recordName: deployDomain,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.CloudFrontTarget(dist),
      ),
    })
  }
}
