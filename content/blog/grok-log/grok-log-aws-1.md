---
author: 'Joe Lauletta'
date: 2025-05-10
title: 'grok-log-aws-1'
tags: ['tech']

# draft: true
---

## As I studied an open-source codebase with intent to contribute, I used [ChatGPT](https://chatgpt.com) as a note-taking tool. This is my side of one of our conversations.

---

In staging (internal EC2 deployment?) -- presumably, since /aws is not touched in dev or fakeprod -- some or all of the following gulp task runner commands are run to spin up AWS infra via CDK. only admin() seems to execute the "bin" script (/aws/bin/aws.js, once compiled from TS), which creates the CDK instance and builds the construct stack, defined in the attached file.

```
/aws/bin/aws.js:

#!/usr/bin/env node

import * as core from 'aws-cdk-lib';
import 'source-map-support/register';
import { CodebaseDevStack } from '../lib/CodebaseDevStack';
import { CodebaseStack } from '../lib/CodebaseStack';

const app = new core.App();

new CodebaseStack(app, 'codebase', {
stackName: 'codebase',
description: 'Production resources for codebase',
});

new CodebaseDevStack(app, 'codebasedev', {
stackName: 'codebasedev',
description: 'Development resources for codebase',
});
```

the gulp command functions:

```
async function cdkdeploy() {
await cmd('yarn', ['cdk', 'deploy', '--all'], { reject: false, cwd: Project.AWS });
}

async function admin() {
const stackName = STACK_NAME.getOrDefault('codebase');

// download credentials
const downloadKeyCommand = await aws.getStackOutputValue(stackName, 'AdminInstanceDownloadKeyCommand');
await cmd('aws', downloadKeyCommand.split(' ').slice(1), { shell: true, reject: false });

// ssh into instance
const sshCommand = await aws.getStackOutputValue(stackName, 'AdminInstanceSshCommand');
const [sshCmd, ...sshArgs] = sshCommand.split(' ');
await cmd(sshCmd, sshArgs);
}

async function admindb() {
const stackName = STACK_NAME.getOrDefault('codebase');
const awsRegion = AWS_REGION.getOrDefault('us-east-1');
const nodeEnv = NODE_ENV.getOrDefault('production');

const dbEnv = await getDbEnv(stackName, awsRegion);
await cmd(
    'psql',
    [
    --host=${dbEnv.DB_HOST},
    --port=${dbEnv.DB_PORT},
    --username=${dbEnv.DB_USERNAME},
    --dbname=${dbEnv.DB_NAME},
    ],
    {
    env: { NODE_ENV: nodeEnv, PGPASSWORD: dbEnv.DB_PASSWORD },
    }
);
}

async function adminmigrate() {
const stackName = STACK_NAME.getOrDefault('codebase');
const awsRegion = AWS_REGION.getOrDefault('us-east-1');
const nodeEnv = NODE_ENV.getOrDefault('production');

const dbEnv = await getDbEnv(stackName, awsRegion);
await cmd('yarn', ['migrate'], { env: { NODE_ENV: nodeEnv, ...dbEnv } });
}
```

in dev and fakeprod, a docker compose network is used to run services (frontend, backend, nginx RP, postgres db, db migrator/seeder, redis message queue + session store, dispatcher, and worker).

questions:

which of the above gulp commands are used in staging
whether docker itself is ditched for an AWS service, and
if it's not, which part of the attached CDK stack file incorporates docker and runs the containers?
could you walk me through the CDK stack file in full?

---

Where is aws_secretsmanager.Secret() pulling secrets from? Does it know to communicate with an .env file? How is the github repo accessed and configured to trigger a CDK deploy? What values are the CI construct params referring to?

CI construct:

```
const ci = new CI(this, 'CI', { repoName: 'codebase', accountId: this.account, domainName }); 

Session secret (it's "keyboardcat" in the .env file, but process.env is never accessed):

    const appSessionSecret = new aws_secretsmanager.Secret(this, 'AppSessionSecret');
    const secrets = {
    SESSION_SECRET: aws_ecs.Secret.fromSecretsManager(appSessionSecret),
    };
```

---

This is the CI construct code:

```
import {
aws_codebuild,
aws_codecommit,
aws_codepipeline,
aws_codepipeline_actions,
aws_ecr,
aws_iam,
Duration,
RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

type CIProps = {
repoName: string;
accountId: string;
domainName: string;
};

const APP_IMAGE_DEFINITION_FILE = 'imagedefinitions.app.json';
const WORKER_IMAGE_DEFINITION_FILE = 'imagedefinitions.worker.json';
const DISPATCHER_IMAGE_DEFINITION_FILE = 'imagedefinitions.dispatcher.json';
const DOCKER_CREDS_SECRET_NAME = 'DockerCreds';
const DOCKER_USERNAME = 'codebase';

export class CI extends Construct {
readonly codeRepository: aws_codecommit.Repository;
readonly apiRepository: aws_ecr.Repository;
readonly nginxRepository: aws_ecr.Repository;
readonly workerRepository: aws_ecr.Repository;
readonly pipeline: aws_codepipeline.Pipeline;
readonly appArtifactPath: aws_codepipeline.ArtifactPath;
readonly workerArtifactPath: aws_codepipeline.ArtifactPath;
readonly dispatcherArtifactPath: aws_codepipeline.ArtifactPath;

private buildOutput: aws_codepipeline.Artifact;

constructor(scope: Construct, id: string, props: CIProps) {
    super(scope, id);

    this.codeRepository = new aws_codecommit.Repository(this, 'CodeRepository', {
    repositoryName: props.repoName,
    });

    const lifecycleRules: aws_ecr.LifecycleRule[] = [
    {
        rulePriority: 1,
        description: 'Keep only one untagged image, expire all others',
        tagStatus: aws_ecr.TagStatus.UNTAGGED,
        maxImageCount: 1,
    },
    ];

    this.apiRepository = new aws_ecr.Repository(this, 'ApiRepository', {
    removalPolicy: RemovalPolicy.DESTROY,
    lifecycleRules,
    });

    this.nginxRepository = new aws_ecr.Repository(this, 'NginxRepository', {
    removalPolicy: RemovalPolicy.DESTROY,
    lifecycleRules,
    });

    this.workerRepository = new aws_ecr.Repository(this, 'WorkerRepository', {
    removalPolicy: RemovalPolicy.DESTROY,
    lifecycleRules,
    });

    const ecrBuild = new aws_codebuild.PipelineProject(this, 'EcrBuild', {
    timeout: Duration.minutes(30),
    cache: aws_codebuild.Cache.local(aws_codebuild.LocalCacheMode.DOCKER_LAYER, aws_codebuild.LocalCacheMode.CUSTOM),
    environment: {
        buildImage: aws_codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: aws_codebuild.ComputeType.MEDIUM,
        privileged: true,
        environmentVariables: {
        AWS_ACCOUNT_ID: {
            type: aws_codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: props.accountId,
        },
        // This is available in the DockerCreds secret under the 'username' key,
        // but it will filter anything that matches the username in the logs.
        // For this reason, we just leave it as plain text.
        DOCKER_USERNAME: {
            type: aws_codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: DOCKER_USERNAME,
        },
        // https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html#build-spec.env.secrets-manager
        DOCKER_PASSWORD: {
            type: aws_codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER,
            value: ${DOCKER_CREDS_SECRET_NAME}:password,
        },
        CI: {
            type: aws_codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: 'true',
        },
        NGINX_REPO_URI: {
            type: aws_codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: this.nginxRepository.repositoryUri,
        },
        API_REPO_URI: {
            type: aws_codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: this.apiRepository.repositoryUri,
        },
        WORKER_REPO_URI: {
            type: aws_codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: this.workerRepository.repositoryUri,
        },
        },
    },
    buildSpec: aws_codebuild.BuildSpec.fromObject({
        version: '0.2',
        cache: {
        paths: ['/root/.yarn/**/*/'],
        },
        phases: {
        install: {
            commands: [
            'yarn install',
            'yarn --cwd web',
            // Install puppeteer dependencies
            'apt-get update',
            'apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget',
            ],
        },
        pre_build: {
            commands: [
            // https://docs.aws.amazon.com/codebuild/latest/userguide/sample-docker.html#sample-docker-files
            'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
            'docker login --username $DOCKER_USERNAME --password $DOCKER_PASSWORD',
            '(docker pull $API_REPO_URI:latest && docker tag $API_REPO_URI:latest codebase:latest) || true',
            '(docker pull $NGINX_REPO_URI:latest && docker tag $NGINX_REPO_URI:latest codebasenginx:latest) || true',
            ],
        },
        build: {
            commands: [
            './bin/ss buildapp',
            'docker tag codebase:latest $API_REPO_URI:latest',
            // NB: The api image also runs the workers!
            'docker tag codebase:latest $WORKER_REPO_URI:latest',
            './bin/ss buildnginx',
            'docker tag codebasenginx:latest $NGINX_REPO_URI:latest',
            './bin/ss testall',
            ],
            finally: ['./bin/ss extractreports'],
            'on-failure': 'ABORT',
        },
        post_build: {
            commands: [
            'docker push $API_REPO_URI:latest',
            'docker push $NGINX_REPO_URI:latest',
            'docker push $WORKER_REPO_URI:latest',
            printf '[{"name":"nginx","imageUri":"'$NGINX_REPO_URI'"}, {"name":"api","imageUri":"'$API_REPO_URI'"}]' > ${APP_IMAGE_DEFINITION_FILE},
            printf '[{"name":"worker","imageUri":"'$WORKER_REPO_URI'"}]' > ${WORKER_IMAGE_DEFINITION_FILE},
            printf '[{"name":"dispatcher","imageUri":"'$WORKER_REPO_URI'"}]' > ${DISPATCHER_IMAGE_DEFINITION_FILE},
            ],
        },
        },
        reports: {
        jest_reports: {
            'file-format': 'JUNITXML',
            'base-directory': 'reports',
            files: ['junit.web.xml', 'junit.api.xml'],
        },
        },
        artifacts: {
        files: [APP_IMAGE_DEFINITION_FILE, DISPATCHER_IMAGE_DEFINITION_FILE, WORKER_IMAGE_DEFINITION_FILE],
        },
    }),
    });
    ecrBuild.addToRolePolicy(
    new aws_iam.PolicyStatement({
        actions: [
        'ecr:BatchGetImage',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchCheckLayerAvailability',
        'ecr:CompleteLayerUpload',
        'ecr:GetAuthorizationToken',
        'ecr:InitiateLayerUpload',
        'ecr:PutImage',
        'ecr:UploadLayerPart',
        ],
        // We must use '*' for ecr:GetAuthorizationToken
        resources: ['*'],
        effect: aws_iam.Effect.ALLOW,
    })
    );

    const sourceOutput = new aws_codepipeline.Artifact('SourceOutput');

    this.buildOutput = new aws_codepipeline.Artifact('BuildOutput');

    this.pipeline = new aws_codepipeline.Pipeline(this, 'Pipeline', {
    restartExecutionOnUpdate: false,
    stages: [
        {
        stageName: 'Source',
        actions: [
            new aws_codepipeline_actions.CodeCommitSourceAction({
            actionName: 'GetSourceCode',
            branch: 'master',
            repository: this.codeRepository,
            output: sourceOutput,
            }),
        ],
        },
        {
        stageName: 'Build',
        actions: [
            new aws_codepipeline_actions.CodeBuildAction({
            actionName: 'BuildImage',
            project: ecrBuild,
            input: sourceOutput,
            outputs: [this.buildOutput],
            }),
        ],
        },
    ],
    });

    this.appArtifactPath = this.buildOutput.atPath(APP_IMAGE_DEFINITION_FILE);
    this.workerArtifactPath = this.buildOutput.atPath(WORKER_IMAGE_DEFINITION_FILE);
    this.dispatcherArtifactPath = this.buildOutput.atPath(DISPATCHER_IMAGE_DEFINITION_FILE);
}
}
```

---

So then, what's the relationship between the github repo and the AWS infrastructure?

---

Here are the git-related gulp command functions:

```
async function deploy() {
const BUMP_FLAGS = {
    PATCH: '--patch',
    MINOR: '--minor',
    MAJOR: '--major',
};

const bump = BUMP.getOrDefault('PATCH');
const branch = BRANCH.getOrDefault('master');
const remote = REMOTE.getOrDefault('aws');

if (!(bump in BUMP_FLAGS)) {
    throw new TypeError(BUMP must be one of: ${Object.keys(BUMP_FLAGS).join(', ')}, got: ${bump});
}
const bumpFlag = BUMP_FLAGS[bump as keyof typeof BUMP_FLAGS];

log('bumping api version');
await cmd('yarn', ['version', bumpFlag, '--no-git-tag-version', '--no-commit-hooks'], { cwd: Project.API });

log('bumping web version');
await cmd('yarn', ['version', bumpFlag, '--no-git-tag-version', '--no-commit-hooks'], { cwd: Project.WEB });

log('committing version changes');
const version = (
    await cmd('node', ['-e', "process.stdout.write(require('./package.json').version);"], {
    cwd: Project.API,
    shell: true,
    stdio: 'pipe',
    })
).stdout;
await cmd('git', ['add', 'api/package.json', 'web/package.json']);
await cmd('git', ['commit', '-m', Bump app version to v${version}]);
await cmd('git', ['tag', '-a', v${version}, '-m', Bump app version to v${version}]);

log('pushing to remotes');
await cmd('git', ['push', 'origin']);
await cmd('git', ['push', remote, ${branch}:master]);
}
```

```
async function rollback() {
const tag = TAG.get();
const branch = BRANCH.getOrDefault('master');
const remote = REMOTE.getOrDefault('aws');

log('getting current version');
const prevVersion = (
    await cmd('node', ['-e', "process.stdout.write(require('./package.json').version);"], {
    cwd: Project.API,
    shell: true,
    stdio: 'pipe',
    })
).stdout;

// Leverage yarn to bump the version for us, so we don't have to deal with edge cases of all the semantic version
// names.
log('bumping version by a minor step');
await cmd('yarn', ['version', '--minor', '--no-git-tag-version', '--no-commit-hooks'], { cwd: Project.API });

log('getting next version');
const nextVersion = (
    await cmd('node', ['-e', "process.stdout.write(require('./package.json').version);"], {
    cwd: Project.API,
    shell: true,
    stdio: 'pipe',
    })
).stdout;

log('cleaning changes');
await cmd('git', ['checkout', './package.json'], { cwd: Project.API });

log(getting commit of tag: ${tag});
const commit = (await cmd('git', ['rev-list', '-n', '1', tag], { shell: true, stdio: 'pipe' })).stdout;

log(reverting all commits back to: ${commit});
await cmd('git', ['revert', '--no-edit', '--no-commit', ${commit}..HEAD]);

log(updating api version to: ${nextVersion});
await cmd('yarn', ['version', '--no-git-tag-version', '--no-commit-hooks', '--new-version', v${nextVersion}], {
    cwd: Project.API,
});

log(updating web version to: ${nextVersion});
await cmd('yarn', ['version', '--no-git-tag-version', '--no-commit-hooks', '--new-version', v${nextVersion}], {
    cwd: Project.WEB,
});

log('committing version changes');
await cmd('git', ['add', 'api/package.json', 'web/package.json']);
await cmd('git', ['commit', '-m', Rollback app version to v${prevVersion} as v${nextVersion}]);
await cmd('git', [
    'tag',
    '-a',
    v${nextVersion},
    '-m',
    Rollback app version to v${prevVersion} as v${nextVersion},
]);

log('pushing to remotes');
await cmd('git', ['push', 'origin']);
await cmd('git', ['push', remote, ${branch}:master]);
}
```

From this, and the fact that the CDK flow has no github integration, would you suppose that the dev treats git and aws as separate processes -- version control / open source provisioning, and deployment, respectively?

---

So a fresh version cut would consist of deploy(), cdkdeploy(), and potentially admin*() for SSH access, mediated entirely via CLI + internal env creds? There's no in-browser setup?

---

Oh, cdkdeploy() doesn't need to follow deploy(), since deploy() pushes to CodeCommit. deploy() needs only run as AWS updates are made.

---