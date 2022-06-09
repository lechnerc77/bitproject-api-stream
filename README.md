# Bit Project: Usage of APIs

This repository contains the code for a Azure Function that reads the `README` file from GitHub repository and publishes the content on [dev.to](https://dev.to/).

## Idea

The idea is to write a blog post in markdown on GitHub and use this as a basis for publishing the post on different platforms and spreading the word across different channels. For this demo we restrict ourselves to the

## Prerequisites

To interact with the GitHub API and the dev.to API we need **API keys** to authenticate the requests. 

> **Do not commit those keys! Put them in the `local.settings.json`**

## Setup

For this sample we will use a HTTP-triggered Azure Function. A timer-based Function would also be perfect for that, but makes the local setup a bit more tedious as a local storage emulator is needed.

The Azure Function will basically execute two steps:

    1. Read the `README.md` file from GitHub repository using the [GitHub REST API](https://docs.github.com/en/rest)
    2. Publish the content on [dev.to](https://dev.to/) using the [Dev.to API](https://developers.forem.com/api#tag/articles)

## Outlook

In a real life setup the code would be a bit more elaborate and the `README.md` file would probably also contain some metadata that is used in the processing via  the nom package [gray-matter](https://www.npmjs.com/package/gray-matter). This will also remove a lot of the hard-coding that is currently part of the code.

In addition one could think of publishing the information about the blog post to further social media channels (like Twitter, LinkedIn or Polywork) via the corresponding APIs.

## Further Links

- [Mozilla Developer Network](https://developer.mozilla.org/en-US/): useful resource around everything web development
- [Octokit SDK](https://github.com/octokit/core.js#readme): SDK to interact with the GitHub API
- [node-fetch](https://www.npmjs.com/package/node-fetch): node-fetch is a library for fetching resources over HTTP(S) and for parsing responses as JSON or text. Be aware of the breaking changes in [version 3](https://github.com/node-fetch/node-fetch/blob/HEAD/docs/v3-UPGRADE-GUIDE.md#converted-to-es-module)