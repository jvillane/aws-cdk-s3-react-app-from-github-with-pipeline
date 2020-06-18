import * as cdk from "@aws-cdk/core";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as codepipelineActions from "@aws-cdk/aws-codepipeline-actions";
import * as s3 from "@aws-cdk/aws-s3";

export interface SimpleWebsitePipelineStackProps extends cdk.StackProps {
  github: {
    owner: string
    repository: string
    branch: string
    oauthToken: string
  }
  bucket: {
    arn: string
  }
}

export class SimpleWebsitePipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: SimpleWebsitePipelineStackProps) {
    super(scope, id, props);

    const outputSources = new codepipeline.Artifact();
    const outputWebsite = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this, 'pipeline', {
      pipelineName: `${id}-pipeline`,
      artifactBucket: s3.Bucket.fromBucketArn(this, 'ArtifactBucketByArn', 'arn:aws:s3:::pit-codepipeline-artifacts'),
      restartExecutionOnUpdate: true
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipelineActions.GitHubSourceAction({
          actionName: 'Checkout',
          owner: props.github.owner,
          repo: props.github.repository,
          branch: props.github.branch,
          oauthToken: cdk.SecretValue.plainText(props.github.oauthToken),
          output: outputSources,
          trigger: codepipelineActions.GitHubTrigger.WEBHOOK
        })
      ]
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        // AWS CodePipeline action to run CodeBuild project
        new codepipelineActions.CodeBuildAction({
          actionName: 'Website',
          project: new codebuild.PipelineProject(this, `${id}-BuildWebsite`, {
            projectName: 'Website',
            buildSpec: codebuild.BuildSpec.fromSourceFilename('./infra/buildspec.yml'),
          }),
          input: outputSources,
          outputs: [outputWebsite],
        }),
      ],
    });

    const bucket = s3.Bucket.fromBucketArn(this, 'BucketByArn', props.bucket.arn);

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        // AWS CodePipeline action to deploy CRA website to S3
        new codepipelineActions.S3DeployAction({
          actionName: 'Website',
          input: outputWebsite,
          bucket: bucket,
        }),
      ],
    })
  }
}
