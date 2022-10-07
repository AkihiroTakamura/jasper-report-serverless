#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { CdkJavaLambdaStack } from '../lib/cdk-java-lambda-stack'
import { Tags } from 'aws-cdk-lib'

const app = new cdk.App()

export type BuildConfig = {
  readonly AWSAccountID: string
  readonly AWSProfileName: string
  readonly AWSProfileRegion: string

  readonly App: string
  readonly Environment: string
  readonly Version: string
  readonly Build: string

  readonly JavaLambdaParameters: JavaLambdaConfig
}

type JavaLambdaConfig = {
  Domain: string
}

export const getConfig = (app: cdk.App): BuildConfig => {
  const env = app.node.tryGetContext('environment')
  if (!env)
    throw new Error(
      'Context variable missing on CDK command. Pass in as `-c environment=XXX`',
    )

  const envConfig = app.node.tryGetContext(env)

  const config: BuildConfig = {
    AWSAccountID: ensureString(envConfig, 'AWSAccountID'),
    AWSProfileName: ensureString(envConfig, 'AWSProfileName'),
    AWSProfileRegion: ensureString(envConfig, 'AWSProfileRegion'),

    App: ensureString(envConfig, 'App'),
    Version: ensureString(envConfig, 'Version'),
    Environment: ensureString(envConfig, 'Environment'),
    Build: ensureString(envConfig, 'Build'),

    JavaLambdaParameters: {
      Domain: ensureString(envConfig['JavaLambdaParameters'], 'Domain'),
    },
  }

  return config
}

const ensureString = (
  object: { [name: string]: any },
  propName: string,
): string => {
  if (!object[propName] || object[propName].trim().length === 0)
    throw new Error(`${propName} does not exist or is empty`)
  return object[propName]
}

const Main = async () => {
  // get config from cdk.json
  const config = getConfig(app)

  // global tag setting
  Tags.of(app).add('App', config.App)
  Tags.of(app).add('Environment', config.Environment)

  // stacks
  new CdkJavaLambdaStack(
    app,
    `${config.App}-${config.Environment}-java-lambda`,
    {
      env: {
        region: config.AWSProfileRegion,
        account: config.AWSAccountID,
      },
      config,
    },
  )
}

Main()
