require('dotenv').config();
const aws = require('aws-sdk');
const mdns = require('mdns-js');
const cast = require('castv2-client');
const http = require('http');
const ip = require('ip');

const host = process.env.HTTP_HOST || ip.address();
const port = process.env.HTTP_PORT || 8080;

aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const startServer = () => {
    let voiceData;
    http.createServer((request, response) => {
        if (request.method === 'POST') {
            let postBody = '';
            let responseBody = '';
            request.on('data', (chunk) => {
                postBody += chunk;
            }).on('end', () => {
                generateVoice(process.env.POLLY_LANG, process.env.POLLY_VOICE, process.env.POLLY_TYPE, process.env.POLLY_SAMPLE_RATE, postBody).then(data => {
                    responseBody = `will speak "${postBody}".`;
                    voiceData = data.AudioStream;
                    response.writeHead(200, {'Content-Type': 'text/plain'});
                    response.end(responseBody);
                }).then(() => {
                    findDevice(process.env.GOOGLE_HOME).then((targetIp) => {
                        transmitCommand(targetIp);
                    });
                });
            });
        } else {
            response.writeHead(200, {'Content-Type': 'audio/mpeg'});
            response.end(voiceData);
        }
    }).listen(port);
};

const generateVoice = (lang, voiceId, textType, sampleRate, text) => {
    return new Promise(async (resolve, reject) => {
        let polly = new aws.Polly({apiVersion: '2016-06-10'});
        await polly.describeVoices({
            LanguageCode: lang
        }, (error) => {
            if (error) {
                reject(error);
            }
        });
        await polly.synthesizeSpeech({
            OutputFormat: 'mp3',
            Text: text,
            VoiceId: voiceId,
            SampleRate: sampleRate,
            TextType: textType
        }, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

const transmitCommand = (targetIp) => {
    const castClient = new cast.Client();
    const defaultReceiver = cast.DefaultMediaReceiver;
    castClient.connect(targetIp, () => {
        castClient.launch(defaultReceiver, (error, player) => {
            if (error) {
                throw new Error(error);
            }
            player.load({
                contentId: `http://${host}:${port}/`,
                contentType: 'audio/mp3',
                streamType: 'BUFFERED',
            }, {autoplay: true}, (error, status) => {
                castClient.close();
                if (error) {
                    throw new Error(error);
                }
            });
        });
    });
};

const findDevice = (targetDevice) => {
    return new Promise((resolve, reject) => {
        let targetIp = '';
        let browser = mdns.createBrowser(mdns.tcp('googlecast'));

        browser.on('ready', function onReady() {
            browser.discover();
        });

        browser.on('update', function onUpdate(data) {
            if (data.addresses[0] === targetDevice || (data.txt && data.txt.indexOf(`fn=${targetDevice}`) >= 0)) {
                targetIp = data.addresses[0];
                browser.stop();
                resolve(targetIp);
            }
        });

        setTimeout(function onTimeout() {
            browser.stop();
            reject(false)
        }, 5000);
    });
};

startServer();
