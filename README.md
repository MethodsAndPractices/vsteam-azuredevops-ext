# vsteam-azuredevops-ext
Containing the official pipeline extension for running VSTeam module on Azure DevOps

## Getting Started

1. clone repo
2. install node version 10.18.0. It has to version 10.18.0 because [something is not working](https://github.com/MicrosoftDocs/azure-devops-docs/issues/8411) with the package sync-request and with the azure devops library. If you need to use multiple versions of node js, then consider [using nvm](https://github.com/nvm-sh/nvm).
3. run `npm install`
4. run `npm test`

## Package Extension

1. install tfx-cli `npm i -g tfx`
2. run `tfx extension create`

## Install Pipeline Task on Azure DevOps directly

You can install the task directly and use it without publishing it to the Marketplace or install it from there of published.

1. login into your Azure DevOps organization with `tfx login ` (you can use basic or PAT token to login)
2. run `tfx build tasks upload --task-path '.\vsteam-azuredevops\V1\'`
