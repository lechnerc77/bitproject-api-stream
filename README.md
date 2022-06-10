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

## Walkthrough

### Step 1: Create the Azure Function

Create the Azure Function in VSCode via the Azure Extension. Name it `BlogPostPublisher`. Use `JavaScript` as the language and `HTTP` as the trigger. Set the authentication to anonymous.

After the Function is created, restrict the HTTP methods to `POST` in the `function.json`. The result should look like this

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": [
        "post"
      ]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

### Step 2: Store the secrets in the `local.settings.json`

To issue API calls to GitHub and dev.to you need to have API keys. For the local development, we store these keys in the `local.settings.json` as `DEV_TO_API_KEY` and `GITHUB_API_KEY`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "DEV_TO_API_KEY": "YOUR API KEY FOR dev.to",
    "GITHUB_API_KEY": "YOUR API KEY/PAT TOKEN FOR GitHub"
  }
}
```

### Step 3: Cleanup the Azure Function

First we clean up the created Azure Function template i.e. the `index.js` file and remove the boilerplate code. The result looks like this:

```javascript
module.exports = async function (context, req) {

}
```

### Step 4: Initialize variables

We assume that the request we get from the caller contains the GitHub repository owner and the name of the repository in the body of the request as `repoowner` and `reponame` respectively. So as a first step we check that these are provided. If not we return an error response:

```javascript
module.exports = async function (context, req) {

    let responseMessage = "";
    let responseStatus = 200;

    if (req.body && req.body.repoowner && req.body.reponame) {
        const repoOwner = req.body.repoowner;
        const repoName = req.body.reponame;
    }    
    else {
        responseMessage = 'Please provide the name of the repository and the repository owner';
        responseStatus = 400;
        context.log(`Status: ${responseStatus} - Message: ${responseMessage}`);
    }

    context.res = {
        status: responseStatus,
        body: responseMessage
    };
}
```

In addition we initialize the API keys from the environment variables:

```javascript
module.exports = async function (context, req) {

    let responseMessage = "";
    let responseStatus = 200;

    if (req.body && req.body.repoowner && req.body.reponame) {
        const repoOwner = req.body.repoowner;
        const repoName = req.body.reponame;

        const gitHubApiKey = process.env["GITHUB_API_KEY"];
        const devToApiKey = process.env["DEV_TO_API_KEY"];
    }    
    else {
        responseMessage = 'Please provide the name of the repository and the repository owner';
        responseStatus = 400;
        context.log(`Status: ${responseStatus} - Message: ${responseMessage}`);
    }

    context.res = {
        status: responseStatus,
        body: responseMessage
    };
}
```

### Step 5: Call GitHub API

The information that we want to publish in our blog post is stored in the `README.md` file. To read the content of the file we need to call the GitHub API. The GitHub API is a REST API that is used to access the contents of a repository. GitHub supports us a bit by providing a SDK for the interaction with the REST endpoints. So we first install the corresponding npm package via:

```bash
npm i @octokit/core --save
```

Next we require it and initialize the GitHub API client:

```javascript
const { Octokit } = require("@octokit/core");

module.exports = async function (context, req) {

    let responseMessage = "";
    let responseStatus = 200;

    if (req.body && req.body.repoowner && req.body.reponame) {
        const repoOwner = req.body.repoowner;
        const repoName = req.body.reponame;

        const gitHubApiKey = process.env["GITHUB_API_KEY"];
        const devToApiKey = process.env["DEV_TO_API_KEY"];

        const octokit = new Octokit({ auth: gitHubApiKey });
    }    
    else {
        responseMessage = 'Please provide the name of the repository and the repository owner';
        responseStatus = 400;
        context.log(`Status: ${responseStatus} - Message: ${responseMessage}`);
    }

    context.res = {
        status: responseStatus,
        body: responseMessage
    };
}
```

After that we can call the GitHub API to read the metadata of the repository and the content of the `README.md` file (see: [https://docs.github.com/en/rest/repos/repos#get-a-repository](https://docs.github.com/en/rest/repos/repos#get-a-repository) and [https://docs.github.com/en/rest/repos/contents#get-a-repository-readme](https://docs.github.com/en/rest/repos/contents#get-a-repository-readme)):

```javascript
const { Octokit } = require("@octokit/core");

module.exports = async function (context, req) {

    let responseMessage = "";
    let responseStatus = 200;

    if (req.body && req.body.repoowner && req.body.reponame) {
        const repoOwner = req.body.repoowner;
        const repoName = req.body.reponame;

        const gitHubApiKey = process.env["GITHUB_API_KEY"];
        const devToApiKey = process.env["DEV_TO_API_KEY"];

        const octokit = new Octokit({ auth: gitHubApiKey });

        const repoMetadata = await octokit.request('GET /repos/{owner}/{repo}', {
            owner: repoOwner,
            repo: repoName
        });

        const readmeEncoded = await octokit.request('GET /repos/{owner}/{repo}/readme', {
            owner: repoOwner,
            repo: repoName
        });


    }    
    else {
        responseMessage = 'Please provide the name of the repository and the repository owner';
        responseStatus = 400;
        context.log(`Status: ${responseStatus} - Message: ${responseMessage}`);
    }

    context.res = {
        status: responseStatus,
        body: responseMessage
    };
}
```

We validate the response codes and return an error response if something went wrong:

```javascript
const { Octokit } = require("@octokit/core");

module.exports = async function (context, req) {

    let responseMessage = "";
    let responseStatus = 200;

    if (req.body && req.body.repoowner && req.body.reponame) {
        const repoOwner = req.body.repoowner;
        const repoName = req.body.reponame;

        const gitHubApiKey = process.env["GITHUB_API_KEY"];
        const devToApiKey = process.env["DEV_TO_API_KEY"];

        const octokit = new Octokit({ auth: gitHubApiKey });

        const repoMetadata = await octokit.request('GET /repos/{owner}/{repo}', {
            owner: repoOwner,
            repo: repoName
        });

        const readmeEncoded = await octokit.request('GET /repos/{owner}/{repo}/readme', {
            owner: repoOwner,
            repo: repoName
        });

       if (repoMetadata.status === 200 && readmeEncoded.status === 200) {
       }
       else
       {
            responseMessage = `Error when fetching metadata (status: ${repoMetadata.status}) or readme (status: ${readmeEncoded.status}) from GitHub repository`;
            responseStatus = 500;
            context.log(responseMessage);    
       }
    }    
    else {
        responseMessage = 'Please provide the name of the repository and the repository owner';
        responseStatus = 400;
        context.log(`Status: ${responseStatus} - Message: ${responseMessage}`);
    }

    context.res = {
        status: responseStatus,
        body: responseMessage
    };
}
```

### Step 6: Decode result from GitHub

According to the GitHub API documentation the content of the `README.md` file is encoded in base64. To decode the content we must first decode it. To do so, we use the `Buffer` of Node.js:

```javascript
const { Octokit } = require("@octokit/core");

module.exports = async function (context, req) {

...

      if (repoMetadata.status === 200 && readmeEncoded.status === 200) {
           const readmeDecodedContent = Buffer.from(readmeEncoded.data.content, readmeEncoded.data.encoding).toString('utf8');

       }
       else
       {
           responseMessage = `Error when fetching metadata (status: ${repoMetadata.status}) or readme (status: ${readmeEncoded.status}) from GitHub repository`;
           responseStatus = 500;
           context.log(responseMessage);    
       }
 
...
 
}
```

### Step 7: Build the request body for dev.to

Dev.to requires a specific format of the request body when publishing a blog post. The format is described in the [dev.to API documentation](https://developers.forem.com/api#operation/createArticle). To create this format we implement a function that puts the necessary pieces from the information we just fetched from GitHub together and call it in our Azure Function:

```javascript
const { Octokit } = require("@octokit/core");

module.exports = async function (context, req) {

...

      if (repoMetadata.status === 200 && readmeEncoded.status === 200) {
           const readmeDecodedContent = Buffer.from(readmeEncoded.data.content, readmeEncoded.data.encoding).toString('utf8');

           const devToArticle = buildDevToArticle(repoMetadata.data, readmeDecodedContent);

       }
       else
       {
           responseMessage = `Error when fetching metadata (status: ${repoMetadata.status}) or readme (status: ${readmeEncoded.status}) from GitHub repository`;
           responseStatus = 500;
           context.log(responseMessage);    
       }
 
...
 
}

function buildDevToArticle(repoMetadata, readmeDecodedContent) {

    const devToArticle = {
        "article": {
            "title": repoMetadata.name,
            "description": repoMetadata.description,
            "body_markdown": readmeDecodedContent,
            "tags": ["microsoft", "azure", "serverless"],
            "published": false,
            "main_image": "https://user-images.githubusercontent.com/69332964/114803220-14269100-9d6d-11eb-9a3a-e92a637e5d79.png"
        }
    };

    return devToArticle;
}
```

### Step 8: Call dev.to API

Now we have everything in place to call the dev.to API and publish our blog post. To be on the save side we do that in draft mode. We also set the `published` flag to `false` to prevent the blog post from being published immediately.

Too make the call we need to install and require the `node-fetch` package. Here we explicitly install version 2 of the package for compatibility reasons:

```bash
npm i node-fetch@v2 --save
```

```javascript
const fetch = require('node-fetch');
const { Octokit } = require("@octokit/core");

module.exports = async function (context, req) {

...
}
```

Now we build the call to the dev.to API endpoint to publish our post by directly calling the HTTP endpoint (see: [https://developers.forem.com/api#operation/createArticle](https://developers.forem.com/api#operation/createArticle)):

```javascript
const fetch = require('node-fetch');
const { Octokit } = require("@octokit/core");

module.exports = async function (context, req) {

...

      if (repoMetadata.status === 200 && readmeEncoded.status === 200) {
            const readmeDecodedContent = Buffer.from(readmeEncoded.data.content, readmeEncoded.data.encoding).toString('utf8');

            const devToArticle = buildDevToArticle(repoMetadata.data, readmeDecodedContent);

            const devToEndPoint = 'https://dev.to/api/articles';

            const devToResponse = await fetch(devToEndPoint,
                {
                    method: 'POST',
                    headers: {
                        'api-key': devToApiKey,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify(devToArticle)
                }
            );

      }
      else
       {
           responseMessage = `Error when fetching metadata (status: ${repoMetadata.status}) or readme (status: ${readmeEncoded.status}) from GitHub repository`;
           responseStatus = 500;
           context.log(responseMessage);    
       }
 
...

}
```

> As you can see the dev.to API does not get any information about the author of the blog post or for whom it should be published. This is implicitly derived by dev.to from the API key handed over in the call.

### Step 9: Check the response

As for the call to GitHub API we check the response status code of the call to dev.to and return a corresponding message to the caller. If we need information from the response body (or in case you want to inspect it in the debugger) we can use the `.json()` method of the `Response` object to get the data:

```javascript
const fetch = require('node-fetch');
const { Octokit } = require("@octokit/core");

module.exports = async function (context, req) {

      if (repoMetadata.status === 200 && readmeEncoded.status === 200) {
            const readmeDecodedContent = Buffer.from(readmeEncoded.data.content, readmeEncoded.data.encoding).toString('utf8');

            const devToArticle = buildDevToArticle(repoMetadata.data, readmeDecodedContent);

            const devToEndPoint = 'https://dev.to/api/articles';

            const devToResponse = await fetch(devToEndPoint,
                {
                    method: 'POST',
                    headers: {
                        'api-key': devToApiKey,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify(devToArticle)
                }
            );

            let devToResponseBody;

            if (devToResponse.status === 201) {
                context.log(`Blog post published at dev.to with status: ${devToResponse.status}`);
                devToResponseBody = await devToResponse.json();

                responseStatus = devToResponse.status;
                responseMessage = `Blog post published at dev.to. Check the post on your dashboard https://dev.to/dashboard (preliminary URL: ${devToResponseBody.url})`;
            }

            else {
                responseMessage = `Error when publishing blog post - status: ${devToResponse.status} - ${devToResponse.statusText}`;
                responseStatus = devToResponse.status;
                context.log(responseMessage);
            }

      }
      else
       {
           responseMessage = `Error when fetching metadata (status: ${repoMetadata.status}) or readme (status: ${readmeEncoded.status}) from GitHub repository`;
           responseStatus = 500;
           context.log(responseMessage);    
       }


...

}

```

> Unfortunately the dev.to API does not return a valid URL for draft blog post. You can try that out by using the corresponding URL provided by the dev.to call.

### Step 10: Code at one glance and test

The complete code of the `index.js` file looks like this:

```javascript
const fetch = require('node-fetch');
const { Octokit } = require("@octokit/core");

module.exports = async function (context, req) {

    let responseMessage = "";
    let responseStatus = 200;

    if (req.body && req.body.repoowner && req.body.reponame) {

        const repoOwner = req.body.repoowner;
        const repoName = req.body.reponame;

        const gitHubApiKey = process.env["GITHUB_API_KEY"];
        const devToApiKey = process.env["DEV_TO_API_KEY"];

        const octokit = new Octokit({ auth: gitHubApiKey });

        const repoMetadata = await octokit.request('GET /repos/{owner}/{repo}', {
            owner: repoOwner,
            repo: repoName
        });

        const readmeEncoded = await octokit.request('GET /repos/{owner}/{repo}/readme', {
            owner: repoOwner,
            repo: repoName
        });

        if (repoMetadata.status === 200 && readmeEncoded.status === 200) {
            const readmeDecodedContent = Buffer.from(readmeEncoded.data.content, readmeEncoded.data.encoding).toString('utf8');

            const devToArticle = buildDevToArticle(repoMetadata.data, readmeDecodedContent);

            const devToEndPoint = 'https://dev.to/api/articles';

            const devToResponse = await fetch(devToEndPoint,
                {
                    method: 'POST',
                    headers: {
                        'api-key': devToApiKey,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify(devToArticle)
                }
            );

            let devToResponseBody;

            if (devToResponse.status === 201) {
                context.log(`Blog post published at dev.to with status: ${devToResponse.status}`);
                devToResponseBody = await devToResponse.json();

                responseStatus = devToResponse.status;
                responseMessage = `Blog post published at dev.to. Check the post on your dashboard https://dev.to/dashboard (preliminary URL: ${devToResponseBody.url})`;
            }

            else {
                responseMessage = `Error when publishing blog post - status: ${devToResponse.status} - ${devToResponse.statusText}`;
                responseStatus = devToResponse.status;
                context.log(responseMessage);
            }
        }
        else {
            responseMessage = `Error when fetching metadata (status: ${repoMetadata.status}) or readme (status: ${readmeEncoded.status}) from GitHub repository`;
            responseStatus = 500;
            context.log(responseMessage);
        }

    }
    else {
        responseMessage = 'Please provide the name of the repository and the repository owner';
        responseStatus = 400;
        context.log(`Status: ${responseStatus} - Message: ${responseMessage}`);
    }


    context.res = {
        status: responseStatus,
        body: responseMessage
    };
}

function buildDevToArticle(repoMetadata, readmeDecodedContent) {

    const devToArticle = {
        "article": {
            "title": repoMetadata.name,
            "description": repoMetadata.description,
            "body_markdown": readmeDecodedContent,
            "tags": ["microsoft", "azure", "serverless"],
            "published": false,
            "main_image": "https://user-images.githubusercontent.com/69332964/114803220-14269100-9d6d-11eb-9a3a-e92a637e5d79.png"
        }
    };

    return devToArticle;
}
```

To test the Azure Function you can start it locally via `func start` or via pressing `F5`. The issue a call using Postman or the VSCode REST extension as shown here:

```http
###
POST http://localhost:7071/api/BlogPostPublisher

{
    "repoowner": "Name of the Owner of the repo",
    "reponame": "Name of the repository"
}
```

This should now create a new blog post in dev.to. You can check that in you dev.to dashboard under [https://dev.to/dashboard](https://dev.to/dashboard)

## Outlook

In a real life setup the code would be a bit more elaborate and the `README.md` file would probably also contain some metadata that is used in the processing via  the nom package [gray-matter](https://www.npmjs.com/package/gray-matter). This will also remove a lot of the hard-coding that is currently part of the code.

In addition one could think of publishing the information about the blog post to further social media channels (like Twitter, LinkedIn or Polywork) via the corresponding APIs.

## Further Links

- [Mozilla Developer Network](https://developer.mozilla.org/en-US/): useful resource around everything web development
- [Octokit SDK](https://github.com/octokit/core.js#readme): SDK to interact with the GitHub API
- [node-fetch](https://www.npmjs.com/package/node-fetch): node-fetch is a library for fetching resources over HTTP(S) and for parsing responses as JSON or text. Be aware of the breaking changes in [version 3](https://github.com/node-fetch/node-fetch/blob/HEAD/docs/v3-UPGRADE-GUIDE.md#converted-to-es-module)
