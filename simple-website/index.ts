#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import {SimpleWebsite} from './simple-website';

class SimpleWebsiteStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    new SimpleWebsite(this, name, {
      domainName: process.env.CDK_DEPLOY_DOMAIN as string,
      siteSubDomain: process.env.CDK_DEPLOY_SUBDOMAIN as string,
    });
  }
}

const app = new cdk.App();
new SimpleWebsiteStack(app, process.env.CDK_DEPLOY_STACKNAME as string, {
  env: {
    region: process.env.CDK_DEFAULT_REGION as string,
    account: process.env.CDK_DEFAULT_ACCOUNT as string
  }
});
app.synth();
