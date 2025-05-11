---
author: 'Joe Lauletta'
date: 2025-05-10
title: 'grok-log-aws-2'
tags: ['tech']

# draft: true
---

## As I studied an open-source codebase with intent to contribute, I used [ChatGPT](https://chatgpt.com) as a note-taking tool. This is my side of one of our conversations.

---

how does "git push aws master:master" work at the end?

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

---

The bottom two commands are the source of the confusion. First one makes enough sense: push to the github remote, set via git remote add. Second one, assuming REMOTE.getOrDefault("aws") returns "aws", would run git push aws... master:master. Does this imply "aws" was set as a branch, somehow linking to the AWS CodeCommit repo? 

---

Nah, that tracks -- "git remote add aws" set the codecommit repo as a second origin. I don't understand "master:master", or the implication that only patches are cut, unless a BUMP env var is manually set to major or minor.

---

I've never used local:remote syntax when pushing to github. Is this an AWS quirk?

---

Define a breaking change, and how problematic code is more easily corrected when pushed as a patch vs. a minor or major change.

---

Explain the difference between these task runner commands:

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

---

What is the "aws" command pointing to, assuming the below cmd() function is running its params as a CLI command in the gulpfile.ts cwd (project root), where "aws" isn't a valid command (nothing in package.json suggesting it could be with deps installed)? Only thought is that there's a cd into ./aws, where "aws" is valid (loads CDK stack), but I'm not seeing it in the code. 

```
export async function getStackOutputValue(stackName: string, exportName: string) { 
const result = await cmd(
    'aws',
    [
    'cloudformation',
    'describe-stacks',
    '--stack-name',
    stackName,
    '--query',
    '"Stacks[0].Outputs[?ExportName==\\' + exportName + '\\].OutputValue"',
    '--no-cli-pager',
    '--output',
    'text',
    ],
    { shell: true, stdio: 'pipe' }
);
return result.stdout;
}
```

---

./aws/package.json binary alias "aws" runs ./aws/bin/aws.ts:

```
#!/usr/bin/env node
import * as core from 'aws-cdk-lib';
import 'source-map-support/register';

import { CodebaseStack } from '../lib/CodebaseStack';

const app = new core.App();

new CodebaseStack(app, 'codebase', {
stackName: 'codebase',
description: 'Production resources for codebase',
});

```

But none of the gulpfile.ts logic contains an "aws" command run in the ./aws directory. My understanding is that loading the CDK root construct in memory is necessary for updating a deployed CDK stack, and is similar to "cdk synth". Is this file accessed under-the-hood somehow when cdk deploy is run?

---

Checks out.

cdk.json:

```
{
"app": "npx ts-node --prefer-ts-exts bin/aws.ts",
"context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "aws-cdk:enableDiffNoFail": "true",
    "@aws-cdk/core:stackRelativeExports": "true",
    "@aws-cdk/aws-ecr-assets:dockerIgnoreSupport": true,
    "@aws-cdk/aws-ecs-patterns:removeDefaultDesiredCount": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-efs:defaultEncryptionAtRest": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true
}
}
```

---

Is the binary alias used? Or the file referenced directly through cdk.json? One paragraph response.

---

The below service is never used by the API in dev -- its encompassing AssociateVideoUrl bullmq job is never enqueued. However, it seems to depend on the same VIDEO_QUEUE_SQS_URL env var that the app's CDK stack does. 

1. My hunch is that AWS VOD requires a queue service for video delivery, but why is an SQS queue called in dev?
2. The services encompassing BullMQ job is set to run every 60 seconds. Why would videos be checked for regularly, rather than ad-hoc when one is uploaded?
3. What exactly is video URL association? Not following the "hslUrl" part of the code.

VideoUrlService.ts:

```
import { inject, injectable } from 'inversify';
import { Config } from '../../config';
import { NotFoundError, UnknownError } from '../../errors';
import { TYPES } from '../../inversify.constants';
import { JSONObject, Logger, Message, MessageQueue } from '../../util';
import { NotationService } from '../Notation';

// Hunch: AWS VOD requires a queue service. This is part of the CDK stack (staging / production).

@injectable()
export class VideoUrlService {
constructor(
    @inject(TYPES.Logger) public logger: Logger,
    @inject(TYPES.MessageQueue) public messageQueue: MessageQueue,
    @inject(TYPES.NotationService) public notationService: NotationService,
    @inject(TYPES.Config) public config: Config
) {}

async processNextMessage(): Promise<void> {
    const queueUrl = this.config.VIDEO_QUEUE_SQS_URL;

    const message = await this.messageQueue.get(queueUrl);
    if (!message) {
    return;
    }

    try {
    await this.process(message);
    } catch (e) {
    this.logger.error(encountered an error when processing message '${message.id}': ${e});
    }

    await this.messageQueue.ack(message);
}

private async process(message: Message) {
    const data: JSONObject = JSON.parse(message.body);

    const srcVideo = data.srcVideo;
    if (!srcVideo) {
    throw new UnknownError(message data missing 'srcVideo' property);
    }
    if (typeof srcVideo !== 'string') {
    throw new UnknownError(message data corrupt 'srcVideo' property must be a string);
    }

    const hlsUrl = data.hlsUrl;
    if (!hlsUrl) {
    throw new UnknownError(message data missing 'hlsUrl' property);
    }
    if (typeof hlsUrl !== 'string') {
    throw new UnknownError(message data corrupt 'hlsUrl' property must be a string);
    }

    const notation = await this.notationService.findByVideoFilename(srcVideo);
    if (!notation) {
    throw new NotFoundError(could not find notation from srcVideo: ${srcVideo});
    }

    await this.notationService.update(notation.id, { videoUrl: hlsUrl });
}
}
```

CDK stack file, ECS setup snippet:

```
    /**
    * ECS ENVIRONMENT
    */

    const cluster = new aws_ecs.Cluster(this, 'Cluster', { vpc, containerInsights: false });
    const environment = {
    NODE_ENV: 'production',
    LOG_LEVEL: 'debug',
    PORT: '3000',
    DOMAIN_NAME: domainName,
    WEB_UI_CDN_DOMAIN_NAME: appDistribution.domainName,
    MEDIA_CDN_DOMAIN_NAME: https://${domain.sub('media')},
    MEDIA_S3_BUCKET: mediaBucket.bucketName,
    VIDEO_SRC_S3_BUCKET: vod.sourceBucket.bucketName,
    VIDEO_QUEUE_SQS_URL: vod.queue.queueUrl,
    DEV_EMAIL: 'dev@codebase.com',
    INFO_EMAIL: 'info@codebase.com',
    DB_HOST: db.hostname,
    DB_PORT: db.port.toString(),
    DB_NAME: db.databaseName,
    DB_USERNAME: db.username,
    DB_PASSWORD: db.password,
    REDIS_HOST: cache.host,
    REDIS_PORT: cache.port.toString(),
    };
    const appSessionSecret = new aws_secretsmanager.Secret(this, 'AppSessionSecret');
    const secrets = {
    SESSION_SECRET: aws_ecs.Secret.fromSecretsManager(appSessionSecret),
    };
    const taskExecutionRole = new aws_iam.Role(this, 'TaskExecutionRole', {
    assumedBy: new aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    roleName: PhysicalName.GENERATE_IF_NEEDED,
    managedPolicies: [aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser')],
    }); 

```

There's no connection between the VideoUrlService and the S3 bucket to which notation videos are uploaded. Here's the key bit from the NotationService's create() handler:

```
// VIDEO_SRC_S3_BUCKET=codebasedev-source-1itxo9v3058ci
this.blobStorage.put(videoFilepath, this.config.VIDEO_SRC_S3_BUCKET, video.createReadStream()),  

```

BONUS QUESTION: The S3 bucket in the CDK environment is pulled from the stack's VOD construct's "sourceBucket" property, which is located with aws_s3.Bucket.fromBucketName(scope, 'VodSourceBucket', bucketName);. Is 'VodSourceBucket' set during in-browser AWS initialization? It's mentioned nowhere else in the codebase.

Vod.ts:

```
export class Vod extends Construct {
readonly template: cloudformation_include.CfnInclude;
readonly sourceBucket: aws_s3.IBucket;
readonly queue: aws_sqs.IQueue;

constructor(scope: Construct, id: string, props: VodProps) {
    super(scope, id);

    this.template = new cloudformation_include.CfnInclude(scope, 'VodTemplate', {
    templateFile: 'templates/vod.yml',
    parameters: {
        AdminEmail: props.adminEmail,
        EnableSns: props.enableSns ? 'Yes' : 'No',
        AcceleratedTranscoding: props.enableAcceleratedTranscoding ? 'ENABLED' : 'DISABLED',
    },
    });

    const bucketName = this.template.getOutput('Source').value;
    this.sourceBucket = aws_s3.Bucket.fromBucketName(scope, 'VodSourceBucket', bucketName);

    const queueArn = this.template.getOutput('SqsARN').value;
    this.queue = aws_sqs.Queue.fromQueueArn(scope, 'VodSqsQueue', queueArn);
}
}
```

---

Only suspects in vod.yml I could find, with no explicit URL anywhere:

```
Source: 
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Type: AWS::S3::Bucket
    Properties:
    LoggingConfiguration:
        DestinationBucketName: !Ref Logs
        LogFilePrefix: s3-access/
    LifecycleConfiguration:
        Rules:
        - Id: !Sub '${AWS::StackName}-source-archive'
            TagFilters:
            - Key: !Ref AWS::StackName
                Value: GLACIER
            Status: Enabled
            Transitions:
            - TransitionInDays: 1
                StorageClass: GLACIER
        - Id: !Sub '${AWS::StackName}-source-deep-archive'
            TagFilters:
            - Key: !Ref AWS::StackName
                Value: DEEP_ARCHIVE
            Status: Enabled
            Transitions:
            - TransitionInDays: 1
                StorageClass: DEEP_ARCHIVE
    BucketEncryption:
        ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
    PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
    Metadata:
    cfn_nag:
        rules_to_suppress:
        - id: W51
            reason: 'Bucket does not need a bucket policy'

S3Config:
    DependsOn: CloudFront
    Type: Custom::S3
    Properties:
    ServiceToken: !GetAtt CustomResource.Arn
    Source: !Ref Source
    IngestArn: !GetAtt StepFunctions.Arn
    Resource: S3Notification
    WorkflowTrigger: !Ref WorkflowTrigger

```

---

To clarify, dev does not incorporate CDK, but a local docker compose network. So this service is outside of the CDK region of the codebase, and not invoked anywhere.

---

With your point 3 in mind, can you explain where the VOD workflow is mimicked in the NotationService's create() handler, or if it's not present, why it's not necessary in dev?

```
async create(args: CreateArgs): Promise<Notation> {
    const { artistName, songName, tagIds, transcriberId, thumbnail, video } = args;

    this.validateMimeType(thumbnail, 'image');
    this.validateMimeType(video, 'video');

    const notation = await this.notationRepo.create({ artistName, songName, transcriberId });

    const thumbnailFilepath = this.getThumbnailFilepath(thumbnail.filename, notation.id);
    const videoFilepath = this.getVideoFilepath(video.filename, notation.id);
    const notationTags = tagIds.map((tagId) => ({ notationId: notation.id, tagId }));

    // There seems to be an issue when creating multiple read streams, so we do this separate from the blob upload.
    const durationMs = await this.videoInfoService.getDurationMs(video.createReadStream());
    notation.durationMs = durationMs;

    const [thumbnailKey] = await Promise.all([
    // MEDIA_S3_BUCKET=codebasedev-mediabucketbcbb02ba-hv54h8w2yv04
    this.blobStorage.put(thumbnailFilepath, this.config.MEDIA_S3_BUCKET, thumbnail.createReadStream()),

    // VIDEO_SRC_S3_BUCKET=codebasedev-source-1itxo9v3058ci
    this.blobStorage.put(videoFilepath, this.config.VIDEO_SRC_S3_BUCKET, video.createReadStream()),  
        
    this.notationTagService.bulkCreate(notationTags),
    ]);

    notation.thumbnailUrl = this.getMediaUrl(thumbnailKey);
    await this.notationRepo.update(notation.id, notation);

    return notation;
}

```

---

Could the chainable function properties below be written within the function itself, or must they come after?

```
export const useGqlHandler: UseGqlHandler = (status, res, handler, deps = []): StaticEventHandlers => {
// eslint-disable-next-line react-hooks/exhaustive-deps
const callback = useCallback(handler, deps);
useEffect(() => {
    if (res.status === status) {
    callback(res as Extract<typeof res, { status: typeof status }>);
    }
}, [status, res, callback]);

// allow for chaining
return staticEventHandlers;
};

useGqlHandler.onInit = (res, handler, deps = []) => {
return useGqlHandler(GqlStatus.Init, res, handler, deps);
};

useGqlHandler.onPending = (res, handler, deps = []) => {
return useGqlHandler(GqlStatus.Pending, res, handler, deps);
};

useGqlHandler.onSuccess = (res, handler, deps = []) => {
return useGqlHandler(GqlStatus.Success, res, handler, deps);
};

useGqlHandler.onErrors = (res, handler, deps = []) => {
return useGqlHandler(GqlStatus.Errors, res, handler, deps);
};

useGqlHandler.onCancelled = (res, handler, deps = []) => {
return useGqlHandler(GqlStatus.Cancelled, res, handler, deps);
};

```

---

Okay, this is an unusual pattern to me -- function object with methods, injecting the developer's choice of useEffect hooks into the calling component which run their respective callbacks. I'm just confused by the useEffect()'s "status" dep, which strikes me as redundant. If the component is calling these useGqlHandler methods in a chainable fashion, each useEffect() is in charge of its own callback. So why is useEffect set to be run more than once?

---

The function methods are meant to track the GraphQL response (loginRes) as its status changes. So it makes sense that, since each method injects its own useEffect meant to re-run on status change, only the correct callback for that status runs (res.status === status). So then I should ask how exactly loginRes is tracked by the calling component. How does loginRes.status morph from "pending" to "success" if fetches are atomic?

```
const [login, loginRes] = useGql(queries.login);

useGqlHandler
    .onPending(loginRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(loginRes, ({ data }) => {
    switch (data.login?.__typename) {
        case "User":

        // Calling useReducer() above allows dispatch() to send loginRes data to the reducer.
        dispatch(AUTH_ACTIONS.setUser({ user: data.login }));

        notify.message.success({
            content: logged in as ${data.login.username},
        });

        break;
        default:
        dispatch(
            AUTH_ACTIONS.setErrors({
            errors: [data.login?.message || UNKNOWN_ERROR_MSG],
            })
        );
    }
    });
```

---

useGql.ts:

```
import { useCallback, useState } from "react";

import { useReq } from "./useReq";
import { useResHandler } from "./useResHandler";

import * as graphql from "../lib/graphql";
import * as xhr from "../lib/xhr";
import { MissingDataError } from "../lib/errors";

const GRAPHQL_URI = ${window.location.origin}/graphql;

// =========================================
//                 TYPES
// =========================================

export type Exec<G extends graphql.Any$gql> = (
variables: graphql.VariablesOf<G>
) => void;

// The reason why we use this instead of $gql.GqlResponseOf, is because the server can return data and populate errors.
// Callers can use the status discriminant to determine what the response looks like instead of testing the presence
// of the data and errors properties.

export enum GqlStatus {
Init,
Pending,
Success,
Errors,
Cancelled,
}

export type GqlRes<G extends graphql.Any$gql> =
| {
    status: GqlStatus.Init;
    }
| {
    status: GqlStatus.Pending;
    }
| {
    status: GqlStatus.Success;
    data: graphql.SuccessfulResponse<G>["data"];
    }
| {
    status: GqlStatus.Errors;
    errors: string[];
    }
| {
    status: GqlStatus.Cancelled;
    };

// =========================================
//                 CLASSES
// =========================================

// Note: Any$gql = any type of $gql object (built fetch request body).
// Note: queries.login, passed to useGql() in AuthCtx.ts, is of this type.

export const useGql = <G extends graphql.Any$gql>(
gql: G
): [exec: Exec<G>, res: GqlRes<G>, cancel: xhr.Cancel, reset: xhr.Reset] => {

const [req, res, cancel, reset] = useReq(graphql.$gql.toGqlResponse);

// Note: calls the core API fetch defined in useReq.ts.
const exec = useCallback(
    (variables: graphql.VariablesOf<G>) => {
    req(GRAPHQL_URI, gql.toRequestInit(variables));
    },
    [req, gql]
);

const [gqlRes, setGqlRes] = useState<GqlRes<G>>({ status: GqlStatus.Init });

useResHandler(xhr.Status.Init, res, (res) => {
    setGqlRes({ status: GqlStatus.Init });
});
useResHandler(xhr.Status.Pending, res, (res) => {
    setGqlRes({ status: GqlStatus.Pending });
});
useResHandler(xhr.Status.Success, res, (res) => {
    const { data, errors } = res.result;
    if (errors) {
    setGqlRes({
        status: GqlStatus.Errors,
        errors: errors.map((error) => error.message),
    });
    } else if (!data) {
    setGqlRes({
        status: GqlStatus.Errors,
        errors: [new MissingDataError().message],
    });
    } else {
    setGqlRes({ status: GqlStatus.Success, data });
    }
});
useResHandler(xhr.Status.Error, res, (res) => {
    setGqlRes({ status: GqlStatus.Errors, errors: [res.error.message] });
});
useResHandler(xhr.Status.Cancelled, res, (res) => {
    setGqlRes({ status: GqlStatus.Cancelled });
});

return [exec, gqlRes, cancel, reset];
};

```

---

1. the api container connects to redis for session store, but i can't tell if it connects to its own redis process on a non-native port, or the docker compose network's redis container hosted on port 6379, which is used for the bullmq job queue.

2. the app's dispatcher and worker containers both connect to the database (db.init()) and i'm not sure why, since they're simply preparing bullmq job instances laid out in inversify, and communicating with the redis container as required.

dispatcher container endpoint:

```
import { Db } from '../db'; 
import { container } from '../inversify.config';
import { TYPES } from '../inversify.constants';
import { getAllJobs } from '../jobs';
import { JobServer } from '../server';
import { Logger } from '../util';

(async () => {
const db = container.get<Db>(TYPES.Db);
await db.init();

const logger = container.get<Logger>(TYPES.Logger);
const jobs = getAllJobs(container);
await Promise.all(jobs.map((job) => job.startDispatching()));

logger.info('job dispatcher started');

const server = container.get<JobServer>(TYPES.WorkerServer);
server.start(jobs);
})();

```

---

Got it -- I do believe it's the same shared container. 6379 is used in the redis init object in inversify config. The redis instance seems to have THREE different uses across this app: API session store, DB cache, and BullMq job queue.

---

"The app doesn't need video playback in dev — just storing the original MP4 may be enough for test/staging workflows."

Are you suggesting that a VOD workflow is required for video playback? Can't it be pulled from the S3 bucket and streamed to the client within the getNotation resolver function? Also realizing that the frontend depends on notation field "videoUrl" for playback, but the field is never set in the NotationService create() function I sent earlier.

```
async create(args: CreateArgs): Promise<Notation> {
    const { artistName, songName, tagIds, transcriberId, thumbnail, video } = args;

    this.validateMimeType(thumbnail, 'image');
    this.validateMimeType(video, 'video');

    const notation = await this.notationRepo.create({ artistName, songName, transcriberId });

    const thumbnailFilepath = this.getThumbnailFilepath(thumbnail.filename, notation.id);
    const videoFilepath = this.getVideoFilepath(video.filename, notation.id);
    const notationTags = tagIds.map((tagId) => ({ notationId: notation.id, tagId }));

    // There seems to be an issue when creating multiple read streams, so we do this separate from the blob upload.
    const durationMs = await this.videoInfoService.getDurationMs(video.createReadStream());
    notation.durationMs = durationMs;

    const [thumbnailKey] = await Promise.all([
    // MEDIA_S3_BUCKET=codebasedev-mediabucketbcbb02ba-hv54h8w2yv04
    this.blobStorage.put(thumbnailFilepath, this.config.MEDIA_S3_BUCKET, thumbnail.createReadStream()),

    // VIDEO_SRC_S3_BUCKET=codebasedev-source-1itxo9v3058ci
    this.blobStorage.put(videoFilepath, this.config.VIDEO_SRC_S3_BUCKET, video.createReadStream()),      
    
    this.notationTagService.bulkCreate(notationTags),
    ]);

    notation.thumbnailUrl = this.getMediaUrl(thumbnailKey);
    await this.notationRepo.update(notation.id, notation);

    return notation;
}
```

The only instance of a call to the NotationService update() function (which handles videoUrl field assignment) happens inside of the VideoUrlService, which we've established isn't used. 

```
async processNextMessage(): Promise<void> {
    const queueUrl = this.config.VIDEO_QUEUE_SQS_URL;

    const message = await this.messageQueue.get(queueUrl);
    if (!message) {
    return;
    }

    try {
    await this.process(message);
    } catch (e) {
    this.logger.error(encountered an error when processing message '${message.id}': ${e});
    }

    await this.messageQueue.ack(message);
}

private async process(message: Message) {
    const data: JSONObject = JSON.parse(message.body);

    const srcVideo = data.srcVideo;
    if (!srcVideo) {
    throw new UnknownError(message data missing 'srcVideo' property);
    }
    if (typeof srcVideo !== 'string') {
    throw new UnknownError(message data corrupt 'srcVideo' property must be a string);
    }

    const hlsUrl = data.hlsUrl;
    if (!hlsUrl) {
    throw new UnknownError(message data missing 'hlsUrl' property);
    }
    if (typeof hlsUrl !== 'string') {
    throw new UnknownError(message data corrupt 'hlsUrl' property must be a string);
    }

    const notation = await this.notationService.findByVideoFilename(srcVideo);
    if (!notation) {
    throw new NotFoundError(could not find notation from srcVideo: ${srcVideo});
    }

    await this.notationService.update(notation.id, { videoUrl: hlsUrl });
}
```

These observations seem to confirm that the app's video layer relies on seed videoUrl-equipped notation records in dev. But I'm not sure why the notation service would be fully built out, including video file upload, with the exception of url assignment and delivery.

---

Within the NotationRepo (CRUD layer w/ MikroORM), there are three main operation classes: (1) basic Entity Manager functions like em.find(), (2) Dataloader functions like Dataloader(someId).load(), and (3) presumably for more complex queries where things like pagination are desired, db.query(), taking a knex query as a callback. Examples in order below. Can you explain the importance of each? Is eschewing the Entity Manager and calling db.query() simply for greater control?

```
async findAll(): Promise<Notation[]> {
    const notations = await this.em.find(NotationEntity, {}, { orderBy: { cursor: QueryOrder.DESC } });
    return pojo(notations);
}

async findAllByTranscriberId(transcriberId: string): Promise<Notation[]> {
    const notations = await this.byTranscriberIdLoader.load(transcriberId);
    this.byTranscriberIdLoader.clearAll();
    return ensureNoErrors(notations);
}
async findSuggestions(notation: Notation, limit: number): Promise<Notation[]> {
    const notationTags = await this.em.find(NotationTagEntity, { notationId: notation.id });
    const tagIds = notationTags.map((notationTag) => notationTag.tagId);
    return await this.db.query<Notation>(findSuggestedNotationsQuery(notation, tagIds, limit));
}

```

---

What is the advantage of graphql-codegen? I see a package.json script called "typegen" which generates a graphQLTypes.ts file, presumably by scanning resolvers for types used and compiling them. But since the developer has already manually declared the types in the resolver files (which I assume is necessary for graphql-codegen to work...), why do they need to be centralized?

---

Oh, so you're saying that the author did not declare these types manually, but rather graphql-codegen inferred them from the schema and resolver operations?

---

But "types.Health" is written below. Was that line of code inserted by graphql-codegen, or did the author have to go back and enter these types after generating the types?

```
import { inject, injectable } from 'inversify';
import { Query, Resolver } from 'type-graphql';
import { TYPES } from '../../inversify.constants';
import { HealthCheckerService } from '../../services';
import { APP_VERSION } from '../../util';
import * as types from '../graphqlTypes';

@Resolver()
@injectable()
export class MetaResolver {
constructor(@inject(TYPES.HealthCheckerService) private healthCheckerService: HealthCheckerService) {}

@Query((returns) => types.Health)
async health(): Promise<types.Health> {
    return await this.healthCheckerService.checkHealth();
}

@Query((returns) => String)
async version(): Promise<string> {
    return APP_VERSION;
}
}
```

---

"Your component tracks loginRes (which is really gqlRes from useState) — a derived state driven by the internal response from useReq."

Would it be accurate to think of the calling component (AuthCtx.tsx - auth context provider) as plugging the useState hooks from useGql() into itself? So when the gqlRes state changes within useGql(), AuthCtx re-runs the handlers with an updated loginRes, triggering the appropriate one's callback?

---

So:

useReq makes the core fetch, and there is a graphql mechanism that tracks the status of the response.

useGql packages a status object + the useReq payload if existent, and passes it up to AuthCtx every time the response status changes.

On each pass from useGql, AuthCtx re-renders with a new loginRes value, re-running logic that depends on it (or all logic?), so the appropriate GqlHandler callback is invoked. 

Since a GqlHander.method runs a useEffect() (in addition to returning the other methods for chainability), I assume those hooks are "plugged into" AuthCtx in the same way, such that on re-render they're not re-imported, but persisted and simply run or not.

---

"Triggers setState() when the response arrives — this is what causes React to re-render the component that called useReq()"

No component directly calls useReq. AuthCtx calls it indirectly by calling useGql. Is this what you meant? How is it that it re-renders only on useGql state update, not useReq?

---

Okay, so technically AuthCtx re-renders on state changes at both levels, twice for every useReq change upward. But only useGql-returned data is consumed within it, so we only consider the useGql-based re-renders.

---

Is parsing this form of abstraction useful outside of the context of this particular app?

---