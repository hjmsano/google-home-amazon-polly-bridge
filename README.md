# Google Home to speak in Amazon Polly voice

## Background
I wanted to notify something through Google Home without requesting or scheduling by myself. Sometimes, notifications through chat apps, browsers or mobile devices are not efficient way because I need to open something, need to wait for arriving, or unlock devices.
For example, when I wait for a long query to the big data platform, why I need to check the query status on the BI tool repeatedly? ideally, once the result has been returned, or the query is failed, just let me know in verbal contact!

## What is this?
This application helps me (perhaps, you) to listen notifications from anywhere I (you) want through Google Home.
The application consisted of three parts.

1. An HTTP endpoint to receive a text message to be notified through Google Home
2. A mechanism to generate voices by leveraging Amazon Polly (and broadcast the voice data through HTTP server)
3. Finding a Google Home device and transmit a command Google Home to speak.

So, Google Home will speak but the voice is Amazon Polly. Don't call me a traitor.

## Pre-requirements
1. Of course, you need one of Google Home Family devices.
2. An AWS credential with Amazon Polly permission is necessary to generate the voice data.
3. This app needs to access Google Home via the local network, so you have to run this app on your machine or a small computer such as RaspberryPi.

## Setup

### Docker

- Build a Docker image.
- Run the image with environment variables.

```sh
docker build -t googlehome-polly-bridge .
docker run --net=host \
-e "AWS_ACCESS_KEY_ID=ABCDEFG" \
-e "AWS_SECRET_ACCESS_KEY=zxcvbnm1234567789asdfghjkl" \
-e "AWS_REGION=ap-northeast-1" \
-e "POLLY_LANG=ja-JP" \
-e "POLLY_VOICE=Takumi" \
-e "POLLY_TYPE=text" \
-e "POLLY_SAMPLE_RATE=22050" \
-e "HTTP_PORT=8080" \
-e "HTTP_HOST=192.168.0.2" \
-e "GOOGLE_HOME=Kitchen" \
--restart=on-failure
googlehome-polly-bridge
```

### Local

- Specify environment variables (or create `.env` file based on the template)
- Then, run the following two commands.

```sh
npm install
npm start
```

## Environment Variables

|Variable|Sample|Note|
|:----|:----|:----|
|AWS_ACCESS_KEY_ID|`ABCDEFG`|AWS credential|
|AWS_SECRET_ACCESS_KEY|`zxcvbnm1234567789asdfghjkl`|AWS credential|
|AWS_REGION|`ap-northeast-1`|AWS Region|
|POLLY_LANG|`en-GB`|Polly Language|
|POLLY_VOICE|`Brian`|Polly Voice| 
|POLLY_TYPE|`text`|Polly supports a plain text & SSML|
|POLLY_SAMPLE_RATE|`22050`|Polly sample rate|
|HTTP_PORT|`8080`|A port number of http server|
|HTTP_HOST|`192.168.0.2`|An IP address of http server|
|GOOGLE_HOME|`Kitchen`|A name or an IP address of Google Home|

## Usage

Just send a POST request with a text as a request body to the endpoint. You can call the same endpoint from any programming languages!

```sh
curl localhost:8080 -X POST -d 'If you can dream it, you can do it.'
```

## Use case
- I'm running Slack bot and notify some message from the CI/CD tool through Google Home.
- A web scraper tell me an update on the specific web site through Google Home.