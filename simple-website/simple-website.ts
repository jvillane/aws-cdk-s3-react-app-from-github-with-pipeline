import * as cdk from '@aws-cdk/core';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets/lib';
import * as s3 from '@aws-cdk/aws-s3';

export interface SimpleWebsiteProps {
  domainName: string;
  siteSubDomain: string;
}

export class SimpleWebsite extends cdk.Construct {
  constructor(parent: cdk.Construct, id: string, props: SimpleWebsiteProps) {
    super(parent, id);

    const zone = route53.HostedZone.fromLookup(this, `${id}-zone`, { domainName: props.domainName });
    const siteDomain = props.siteSubDomain + '.' + props.domainName;
    new cdk.CfnOutput(this, 'Site', { value: 'https://' + siteDomain });

    const bucket = new s3.Bucket(this, id, {
      bucketName: id,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: bucket.bucketArn,
      description: 'Website bucket\'s ARN',
    });

    const certificateArn = new acm.DnsValidatedCertificate(this, `${id}-certificate`, {
      domainName: siteDomain,
      hostedZone: zone,
      region: 'us-east-1',
    }).certificateArn;
    new cdk.CfnOutput(this, 'Certificate', { value: certificateArn });

    const distribution = new cloudfront.CloudFrontWebDistribution(this, `${id}-distribution`, {
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [ siteDomain ],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket
          },
          behaviors : [ {isDefaultBehavior: true}],
        }
      ]
    });
    new cdk.CfnOutput(this, `SiteDistribution`, { value: distribution.distributionId });

    new route53.ARecord(this, `${id}-alias-record`, {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone
    });
  }
}
