# About

This project provides a Serverless API to create PDFs using Jasper Report.
Users can POST APIKey and JSON to receive a formatted report in PDF format via Jasper Report.

# How To Deploy

1. Complete the configuration on the client machine to be able to run the aws CLI in the profile.
2. Requires a Route53 hosted zone as an endpoint for the API. Create a hosted zone in Route53.
3. Open the project in VisualStudioCode and reopen it in Dev Container
4. edit `/workspace/cdk/cdk.json`. `AWSAccountID`, `AWSProfileName`, `AWSProfileRegion`, `JavaLambdaParameters.Domain`
5. Open the Terminal of VisualStudioCode and execute the following command

```bash
cd /workspace/app
mvn install # make lambda-java jar file
cd /workspace/cdk
npm install
cdk deploy --profile your-aws-profile -c environment=dev
```

# How to use APIs

## 1. Get your API key

After deployment, open APIGateway from AWS Console to get the value of apiKey

![image](https://i.imgur.com/aIf6i9h.png)

## 2. Create report difinition by Jasper Studio

download and install jasper studio from [here](https://community.jaspersoft.com/project/jaspersoft-studio/releases)

Create a new report and save the file with extension `.jrxml`

## 3. place report difinition file into S3

```
curl -L -X PUT 'https://print.[your-domain]/prod/template/[your-report-file-name].jrxml' \
-H 'Content-Type: application/jrxml' \
-H 'x-api-key: [your api key]' \
--data-binary '@/[your-local-path]/[your-report-file-name].jrxml'
```

## 3. call api through cloudfront

```
curl -L -X POST 'https://print.[your-domain]/prod/report' \
-H 'Content-Type: application/json' \
-H 'x-api-key: [your api key]' \
--data-raw '{
    "templatePath": "[your-report-file-name].jrxml",
    "parameters": {
        "someparam": "some value"
    },
    "data": [
        { "id": 1, "title": "demo"}
    ]
}
' \
--output output.pdf
```

body json's description

- `templatePath`: required. your uploaded jrxml file(find from S3)
- `parameters` : optionally. your jasper report execution parameters using `$P{xxx}` (map)
- `data`: required. your jasper report data using `$F(xxx)` (array maps)

# tips

## how to place image(from url)

- Place an Image Object on the report from jasper studio.
- Receives URL from parameters and parses it with java.net.URL as follows
  - `<imageExpression><![CDATA[new java.net.URL($P{url})]]></imageExpression>`
- Execute with url as parameter
