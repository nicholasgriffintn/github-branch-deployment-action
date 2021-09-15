# GitHub Action for deploying a build to a branch

The purpose of this action is to work alongside build processes that clone a built version of your project from a branch, allowing you to extend your GitHub Action to push the distribution of your application to a seperate branch on the same repo or another repo that you give it access to.

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
        uses: nicholasgriffin/github-branch-deployment-action@main
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
