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

        //The GitHub part: https://docs.github.com/en/rest
        // Fetch the metadata of the repository (https://docs.github.com/en/rest/repos/repos#get-a-repository) 

        const repoMetadata = await octokit.request('GET /repos/{owner}/{repo}', {
            owner: repoOwner,
            repo: repoName
        });

        // Read the repository README.md: https://docs.github.com/en/rest/repos/contents#get-a-repository-readme 
        // There is also an option to fetch the readme from a directory: https://docs.github.com/en/rest/repos/contents#get-a-repository-readme-for-a-directory
        const readmeEncoded = await octokit.request('GET /repos/{owner}/{repo}/readme', {
            owner: repoOwner,
            repo: repoName
        });

        if (repoMetadata.status === 200 && readmeEncoded.status === 200) {
            // As the content is returned base64 encoded, we need to decode it
            const readmeDecodedContent = Buffer.from(readmeEncoded.data.content, readmeEncoded.data.encoding).toString('utf8');

            // The Dev.to part: https://dev.to/api/
            // Transform information for dev.to

            const devToArticle = buildDevToArticle(repoMetadata.data, readmeDecodedContent);

            // Publish to dev.to https://developers.forem.com/api#tag/articles
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
                devToResponseBody = await devToResponse.json();

                responseStatus = devToResponse.status;
                responseMessage = `Blog post published at dev.to. Check the post on your dashboard https://dev.to/dashboard (preliminary URL: ${devToResponseBody.url})`;
                context.log(responseMessage);
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