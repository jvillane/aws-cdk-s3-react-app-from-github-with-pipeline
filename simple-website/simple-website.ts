import * as cdk from '@aws-cdk/core';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import {HttpVersion} from '@aws-cdk/aws-cloudfront';
import * as iam from '@aws-cdk/aws-iam';
import {Effect} from '@aws-cdk/aws-iam';
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

    const hostedZone = route53.HostedZone.fromLookup(this, `${id}-zone`, { domainName: props.domainName });
    const siteDomain = props.siteSubDomain + '.' + props.domainName;
    new cdk.CfnOutput(this, 'Site', { value: 'https://' + siteDomain });

    const oai = new cloudfront.OriginAccessIdentity(this, `${id}-oai`, {
      comment: `access-identity-${id}`
    })

    const bucket = new s3.Bucket(this, id, {
      bucketName: id,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [bucket.arnForObjects('*')],
      principals: [oai.grantPrincipal]
    }));

    new cdk.CfnOutput(this, 'BucketArn', {
      value: bucket.bucketArn,
      description: "Website bucket's ARN",
    });

    const certificateArn = new acm.DnsValidatedCertificate(this, `${id}-certificate`, {
      domainName: siteDomain,
      hostedZone,
      region: 'us-east-1',
    }).certificateArn;
    new cdk.CfnOutput(this, 'Certificate', { value: certificateArn });

    const distribution = new cloudfront.CloudFrontWebDistribution(this, `${id}-distribution`, {
      httpVersion: HttpVersion.HTTP2,
      defaultRootObject: 'index.html',
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [ siteDomain ],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      errorConfigurations: [{
        errorCode: 404,
        errorCachingMinTtl: 300,
        responsePagePath: '/index.html',
        responseCode: 200
      }],
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: oai
          },
          behaviors : [ {isDefaultBehavior: true}],
        }
      ]
    });
    new cdk.CfnOutput(this, `SiteDistribution`, { value: distribution.distributionId });

    new route53.ARecord(this, `${id}-alias-record`, {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: hostedZone
    });
  }
}
