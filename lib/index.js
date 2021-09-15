"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const spawn = require('child_process').spawn;
const https = require('https');
const fs = require('fs');
const path = require('path');
const { stream: fgStream } = require('fast-glob');
const { homedir, tmpdir } = require('os');
const gitUrlParse = require('git-url-parse');
const git = require('isomorphic-git');
const core = require('@actions/core');
const github = require('@actions/github');
/*
 * This function will execute a command on the machine
 */
const exec = (cmd, options = {}) => {
    return new Promise((resolve, reject) => spawn('bash', ['-c', cmd], Object.assign({ env: Object.assign({ HOME: process.env.HOME }, process.env), stdio: ['pipe', 'pipe', 'pipe'] }, options))
        .on('error', (err) => {
        console.error(err);
        throw err;
    })
        .on('close', (code) => {
        if (code !== 0) {
            return reject(Object.assign(new Error(`Invalid exit code: ${code}`), { code }));
        }
        return resolve(code);
    })
        .on('error', reject));
};
/*
 * This function takes the environment vars and formats them,
 * or errors if a required value is not present.
 */
const returnConfig = () => {
    if (!process.env.GITHUB_TOKEN) {
        throw new Error('A GITHUB_TOKEN must be defined.');
    }
    if (!process.env.BRANCH) {
        throw new Error('A BRANCH must be defined.');
    }
    const selectedRepo = !process.env.REPO ? 'self' : process.env.REPO;
    if (selectedRepo === 'self' && !process.env.GITHUB_REPOSITORY) {
        throw new Error('A GITHUB_REPOSITORY is required when using the repo `self');
    }
    const githubRepoURL = selectedRepo === 'self'
        ? `https://x-access-token:${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`
        : gitUrlParse(selectedRepo);
    if (selectedRepo !== 'self') {
        if (githubRepoURL.protocol === 'ssh') {
            throw new Error('This action does not support SSH repo URL currently. Sorry about that!');
        }
        if (githubRepoURL.resource !== 'github.com') {
            throw new Error('This action does not repos hosted outside of GitHub currently. Sorry about that!');
        }
    }
    if (!process.env.GITHUB_EVENT_PATH) {
        throw new Error('GITHUB_EVENT_PATH must be defined');
    }
    const config = {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
        CI: process.env.CI,
        GITHUB_WORKFLOW: process.env.GITHUB_WORKFLOW,
        GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
        GITHUB_RUN_NUMBER: process.env.GITHUB_RUN_NUMBER,
        GITHUB_JOB: process.env.GITHUB_JOB,
        GITHUB_ACTION: process.env.GITHUB_ACTION,
        GITHUB_ACTION_PATH: process.env.GITHUB_ACTION_PATH,
        GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
        GITHUB_ACTOR: process.env.GITHUB_ACTOR,
        GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
        GITHUB_EVENT_NAME: process.env.GITHUB_EVENT_NAME,
        GITHUB_EVENT_PATH: process.env.GITHUB_EVENT_PATH,
        GITHUB_WORKSPACE: process.env.GITHUB_WORKSPACE,
        GITHUB_SHA: process.env.GITHUB_SHA,
        GITHUB_REF: process.env.GITHUB_REF,
        GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF,
        GITHUB_BASE_REF: process.env.GITHUB_BASE_REF,
        GITHUB_SERVER_URL: process.env.GITHUB_SERVER_URL,
        GITHUB_API_URL: process.env.GITHUB_API_URL,
        GITHUB_GRAPHQL_URL: process.env.GITHUB_GRAPHQL_URL,
        RUNNER_OS: process.env.RUNNER_OS,
        RUNNER_TEMP: process.env.RUNNER_TEMP,
        RUNNER_TOOL_CACHE: process.env.RUNNER_TOOL_CACHE,
        TEMP_DIR_NAME: 'github-branch-deployment-action-',
        REPO: selectedRepo,
        BRANCH: process.env.BRANCH,
        FOLDER: process.env.FOLDER || '.',
        MESSAGE: process.env.MESSAGE || 'Build: ({sha}) {msg}',
        URL: selectedRepo !== 'self' ? githubRepoURL.href : githubRepoURL,
    };
    return config;
};
/*
 * Check if we are in a git repo
 */
const isThisAGitRepo = (dir) => __awaiter(void 0, void 0, void 0, function* () {
    return yield fs
        .stat(path.join(dir, '.git'))
        .then((s) => s.isDirectory())
        .catch(() => false);
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    console.log('Generating the config...');
    const config = returnConfig();
    console.log('Parsing the workflow event...');
    const event = JSON.parse((yield fs.promises.readFile(config.GITHUB_EVENT_PATH)).toString());
    if (!event) {
        throw new Error('Action was unable to complete. No event provided.');
    }
    console.log('Parsing GitHub data...');
    const gitData = {
        name: ((_a = event.pusher) === null || _a === void 0 ? void 0 : _a.name)
            ? (_b = event.pusher) === null || _b === void 0 ? void 0 : _b.name
            : config.GITHUB_ACTOR
                ? config.GITHUB_ACTOR
                : 'GitHub Action',
        email: ((_c = event.pusher) === null || _c === void 0 ? void 0 : _c.email)
            ? (_d = event.pusher) === null || _d === void 0 ? void 0 : _d.email
            : config.GITHUB_ACTOR
                ? `${config.GITHUB_ACTOR}@users.noreply.github.com`
                : 'nobody@users.noreply.github.com',
    };
    if (!gitData || !gitData.name || !gitData.email) {
        throw new Error('Action was unable to complete. No git data was generated.');
    }
    console.log(`Configuring git to use the name "${gitData.name}" and email "${gitData.email}"...`);
    yield exec(`git config --global user.name "${gitData.name}"`);
    yield exec(`git config --global user.email "${gitData.email}"`);
    console.log(`Creating temp directory...`);
    const TMP_DIR = yield fs.promises.mkdtemp(path.join(tmpdir(), config.TEMP_DIR_NAME));
    const TMP_REPO_DIR = path.join(TMP_DIR, 'repo');
    const SSH_AUTH_SOCK = path.join(TMP_DIR, 'ssh_agent.sock');
    const CHILD_ENV = Object.assign({}, process.env, {
        SSH_AUTH_SOCK,
    });
    console.log('Cloning the repo...');
    yield exec(`git clone "${config.URL}" "${TMP_REPO_DIR}"`, {
        env: CHILD_ENV,
    });
    console.log('Checking out a temp branch...');
    yield exec(`git checkout -b "${Math.random().toString(36).substring(2)}"`, {
        env: CHILD_ENV,
        cwd: TMP_REPO_DIR,
    });
    console.log(`Deleting the "${config.BRANCH}" branch...`);
    yield exec(`git branch -D "${config.BRANCH}"`, {
        env: CHILD_ENV,
        cwd: TMP_REPO_DIR,
    });
    console.log(`Checking out ${config.BRANCH}" as orphan...`);
    yield exec(`git checkout --orphan "${config.BRANCH}"`, {
        env: CHILD_ENV,
        cwd: TMP_REPO_DIR,
    });
    console.log(`Clearing all files from the target branch "${config.BRANCH}"...`);
    const filesToClear = fgStream(['**/*', '!.git']);
    filesToClear.map((file) => {
        fs.promises.unlink(file);
    });
    console.log(`Copying all files from the target folder "${config.FOLDER}"...`);
    yield exec(`cp -rT "${path.resolve(process.cwd(), config.FOLDER)}"`);
    console.log('Staging files...');
    yield exec(`git add -A`, { env: CHILD_ENV, cwd: TMP_REPO_DIR });
    console.log('Commiting files...');
    const gitLog = yield git.log({
        fs,
        depth: 1,
        dir: process.cwd(),
    });
    const commit = gitLog.length > 0 ? gitLog[0] : undefined;
    console.log('commit data:', commit);
    const gitInfo = {
        sha: commit && commit.oid ? commit.oid : config.GITHUB_SHA,
        message: commit && commit.commit.message
            ? commit.commit.message
            : `${config.GITHUB_WORKFLOW} - ${config.GITHUB_RUN_ID} - ${config.GITHUB_RUN_NUMBER}`,
    };
    yield git.commit({
        fs,
        dir: TMP_REPO_DIR,
        message: config.MESSAGE.replace(/\{workflow\}/g, config.GITHUB_WORKFLOW || '')
            .replace(/\{run\-id\}/g, config.GITHUB_RUN_ID || '')
            .replace(/\{run\-num\}/g, config.GITHUB_RUN_NUMBER || '')
            .replace(/\{job\-id\}/g, config.GITHUB_JOB || '')
            .replace(/\{ref\}/g, config.GITHUB_REF || '')
            .replace(/\{branch\}/g, config.BRANCH || '')
            .replace(/\{sha\}/g, gitInfo.sha.substr(0, 7))
            .replace(/\{long\-sha\}/g, gitInfo.sha)
            .replace(/\{msg\}/g, gitInfo.message),
        author: {
            name: gitData.name,
            email: gitData.email,
        },
    });
    console.log('Pushing commit...');
    const GITHUB_PUSH_EVENT = yield exec(`git push -f origin "${config.BRANCH}"`, { env: CHILD_ENV, cwd: TMP_REPO_DIR });
    console.log('Deployment was successful!', GITHUB_PUSH_EVENT);
});
main().catch((err) => {
    console.error(err);
    console.error(err.stack);
    process.exit(err.code || -1);
});
