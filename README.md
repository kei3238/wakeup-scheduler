# Wake Up Scheduler

## Usage

### Create setting.json

```
{
   "hue": {
      "bridgeIp": "your-hue-bridge IP",
      "username": "your-api-username",
      "groupId": your-hue-groupId (e.g., 1),
      "brightness": prefered-brightness (e.g., 254),
      "millisecTransitiontime": prefered-transition-time (e.g., 400),
   },
   "remo": {
      "apiToken": "your-nature-remo-api-token",
      "deviceId": "your-nature-remo-device-id",
      "delonghiOnSignalId": "your-nature-remo-device-signal-id",
      "coolerOnSignalId": "your-nature-remo-device-signal-id",
      "millisecTransitiontime": prefered-transition-time (e.g., 400),
      "lowTempThreshold": prefered-lower-threthold-temperature (e.g., 20),
      "highTempThreshold": prefered-higher-threthold-temperature (e.g., 26)
   },
   "slack": {
      "apiToken": "your-slack-channel-history-api",
      "channelId": "your-slack-channel-id",
      "postCount": prefered-number-of-post-to-be-get (e.g., 20)
   }
}
```

### Run server
```
$ npm install
$ node server.js
```