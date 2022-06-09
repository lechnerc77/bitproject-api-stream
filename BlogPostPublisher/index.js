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

        // As the content is returned base64 encoded, we need to decode it
        const readmeDecoded = Buffer.from(readmeEncoded.data.content, readmeEncoded.data.encoding).toString('utf8');


        // The Dev.to part: https://dev.to/api/
        // Transform information for dev.to

        // Publish to dev.to https://developers.forem.com/api#tag/articles


        context.log(`Processing done`);
    }
    else {
        responseMessage = "Please provide the name of the repository and the repository owner";
        responseStatus = 400;
        context.log(`Status: ${responseStatus} - Message: ${responseMessage}`);

    }


    context.res = {
        status: responseStatus,
        body: responseMessage
    };
}