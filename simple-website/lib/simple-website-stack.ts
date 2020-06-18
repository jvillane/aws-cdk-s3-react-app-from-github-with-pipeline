import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";

export class SimpleWebsiteStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'websiteBucket', {
      bucketName: id,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html'
    });

    new cdk.CfnOutput(this, 'websiteBucketArn', {
      value: bucket.bucketArn,
      description: 'Website bucket\'s ARN',
    });
  }
}
