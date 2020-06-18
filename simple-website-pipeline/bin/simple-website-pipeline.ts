import {App} from '@aws-cdk/core'
import {SimpleWebsitePipelineStack} from "../lib/simple-website-pipeline-stack";

console.log(process.env);

const app = new App();
new SimpleWebsitePipelineStack(app, process.env.CDK_DEPLOY_STACKNAME as string, {
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
app.synth();
