# GitHub Action for deploying a build to a branch

The purpose of this action is to work alongside build processes that clone a built version of your project from a branch, allowing you to extend your GitHub Action to push the distribution of your application to a seperate branch on the same repo or another repo that you give it access to.

[![Latest Test](https://github.com/nicholasgriffintn/github-branch-deployment-action/actions/workflows/ci-test.yml/badge.svg)](https://github.com/nicholasgriffintn/github-branch-deployment-action/actions/workflows/ci-test.yml)

You can use it in your action like this:

```yaml
name: Build and Push to Serv Content

on:
  push:
    branches: [main]

jobs:
  serv_content:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 12.x

      - name: Install
        run: npm ci

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build

      - name: Push
        uses: nicholasgriffintn/github-branch-deployment-action@0.0.1
        env:
          GITHUB_TOKEN: ${{ secrets.DEPLOYMENT_GITHUB_TOKEN }}
          BRANCH: serv_content
          FOLDER: dist
          MESSAGE: 'Build: ({sha}) {msg}'
```

Here's further explanation on those inputs:

| name         | value  | default                | description                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------ | ------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GITHUB_TOKEN | string | ${{ github.token }}    | This is used to allow the action to commmunicate with your repos. You can use the standard [workflow token](https://docs.github.com/en/free-pro-team@latest/actions/reference/authentication-in-a-workflow#using-the-github_token-in-a-workflow) or use a [Personal Access Token](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token). |
| REPO         | string | 'self'                 | By default, this will use the same repo that the action is contained within, you can add a different repo url here if you would like to push elsewhere.                                                                                                                                                                                                                                              |
| BRANCH       | string | null                   | You are required to enter a branch here, this is the branch that the action will push changes to.                                                                                                                                                                                                                                                                                                    |
| FOLDER       | string | '.'                    | This is the folder that should be pushed to your repo and branch, by default, it uses the root folder.                                                                                                                                                                                                                                                                                               |
| MESSAGE      | string | 'Build: ({sha}) {msg}' | This is the message that is used for the commit, use `{sha}` and `{msg}` to insert the sha and msg of the commit that triggered the build.                                                                                                                                                                                                                                                           |

## Config data

```javascript
{
  GITHUB_TOKEN: '***',
  CI: 'true',
  GITHUB_WORKFLOW: "Test the action's deployments to a new branch",
  GITHUB_RUN_ID: '1239320120',
  GITHUB_RUN_NUMBER: '3',
  GITHUB_JOB: 'test',
  GITHUB_ACTION: '__self',
  GITHUB_ACTION_PATH: undefined,
  GITHUB_ACTIONS: 'true',
  GITHUB_ACTOR: 'nicholasgriffintn',
  GITHUB_REPOSITORY: 'nicholasgriffintn/github-branch-deployment-action',
  GITHUB_EVENT_NAME: 'push',
  GITHUB_EVENT_PATH: '/home/runner/work/_temp/_github_workflow/event.json',
  GITHUB_WORKSPACE: '/home/runner/work/github-branch-deployment-action/github-branch-deployment-action',
  GITHUB_SHA: '893b0f9ed05157427e0ec22fd117a5ee0377e3f2',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_HEAD_REF: '',
  GITHUB_BASE_REF: '',
  GITHUB_SERVER_URL: 'github.com',
  GITHUB_API_URL: 'api.github.com',
  GITHUB_GRAPHQL_URL: 'api.github.com/graphql',
  RUNNER_OS: 'Linux',
  RUNNER_TEMP: '/home/runner/work/_temp',
  RUNNER_TOOL_CACHE: '/opt/hostedtoolcache',
  TEMP_DIR_NAME: 'github-branch-deployment-action-',
  REPO: 'self',
  BRANCH: 'test',
  FOLDER: 'dist',
  MESSAGE: 'Build: ({sha}) {msg}',
  URL: '***github.com/nicholasgriffintn/github-branch-deployment-action.git'
}
```
