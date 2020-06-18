#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { SimpleWebsiteStack } from '../lib/simple-website-stack';

const app = new cdk.App();
new SimpleWebsiteStack(app, process.env.CDK_DEPLOY_STACKNAME as string);
app.synth();
