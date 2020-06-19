#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import {App} from '@aws-cdk/core';
import {SimpleWebsitePipeline} from "./simple-website-pipeline";

class SimpleWebsitePipelineStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    new SimpleWebsitePipeline(this, process.env.CDK_DEPLOY_STACKNAME as string, {
      github: {
        owner: process.env.CDK_DEPLOY_GITHUB_OWNER as string,
        repository: process.env.CDK_DEPLOY_GITHUB_REPOSITORY as string,
        branch: process.env.CDK_DEPLOY_GITHUB_BRANCH as string,
        oauthToken: process.env.CDK_DEPLOY_GITHUB_OAUTH_TOKEN as string
      },
      bucket: {
        arn: process.env.CDK_DEPLOY_BUCKET_ARN as string
      }
    });
  }
}

const app = new App();
new SimpleWebsitePipelineStack(app, process.env.CDK_DEPLOY_STACKNAME as string, {
  env: {
    region: process.env.CDK_DEFAULT_REGION as string,
    account: process.env.CDK_DEFAULT_ACCOUNT as string
  }
});
app.synth();
