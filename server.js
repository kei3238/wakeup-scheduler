var axios = require('axios');
var schedule = require('node-schedule');
var ApiScheduler = require('./api-scheduler');

// Read settings.
const setting = require('./setting.json');

class WakeUpRoutine extends ApiScheduler {
  constructor(setting) {
    super();
    
    // Hue API settings.
    this.hueBridgeIp = setting.hue.bridgeIp;
    this.username = setting.hue.username;
    this.groupId = setting.hue.groupId || 1;
    this.brightness = setting.hue.brightness || 254;
    this.msecTransTimeHueBefore = setting.hue.millisecTransitiontimeBefore;
    this.msecTransTimeHueAfter  = setting.hue.millisecTransitiontimeAfter;

    // Slack channel API settings.
    this.slackApiUrl = "https://slack.com/api/channels.history";
    this.slackApiToken = setting.slack.apiToken;
    this.slackChannelId = setting.slack.channelId;
    this.slackPostCount = setting.slack.postCount || 20;

    // Nature remo API settings.
    this.remoApiToken = setting.remo.apiToken;
    this.remoDeviceId = setting.remo.deviceId;
    this.delonghiOnSignalId = setting.remo.delonghiOnSignalId;
    this.coolerOnSignalId = setting.remo.coolerOnSignalId;
    this.msecTransTimeAC = setting.remo.millisecTransitiontime;
    this.lowTempThreshold = setting.remo.lowTempThreshold || 20;
    this.highTempThreshold = setting.remo.highTempThreshold || 27;

    // Initialize.
    this.latestPostTimestamp = null;
    this.latestPost = null;
  }

  start () {
    
    // Register API schedulers.
    this.jobInvokeHue = 
      schedule.scheduleJob('0 0 0 1 1 0', function() {
      this.turnOnHueTargetGroup()
    }.bind(this));

    this.jobInvokeAC = 
      schedule.scheduleJob('0 0 0 1 1 0', function() {
      // this.turnOnDelonghi()
      this.turnOnAirConditioner()
    }.bind(this));

    // Cancel.
    this.jobInvokeHue.cancel();
    this.jobInvokeAC.cancel();

    // Slack check scheduling.
    var jobCheckSlack = schedule.scheduleJob('* * * * *', function() {

      axios
        .get(`${this.slackApiUrl}?token=${this.slackApiToken}&channel=${this.slackChannelId}&count=${this.slackPostCount}`)
        .then(function (response) {
          var messages = response.data.messages;
          for (var message of messages) {
            if (this.checkSettingValue(message.text.trim()).valid) {
              var latestPost = message;
              break;
            }
            else {
              continue;
            }
          }

          // 
          if (this.latestPostTimestamp !== latestPost.ts) {

            // Update.
            this.latestSetting = latestPost.text.trim();
            this.latestPostTimestamp = latestPost.ts;

            // Check timer setting.
            var settingString = this.checkSettingValue(this.latestSetting).result

            if (settingString === 'TIME') {
              // Define time to wake up.
              var targetTimeHue = this.getTargetTimeStamp (this.latestSetting);
              var targetTimeAC = this.getTargetTimeStamp (this.latestSetting);

              // Set Hue timer.
              this.setInvokeTimer(
                'Hue',
                this.jobInvokeHue,
                targetTimeHue,
                this.msecTransTimeHueBefore,
              );

              // Set De'Longhi timer.
              this.setInvokeTimer(
                "Air conditioner",
                this.jobInvokeAC,
                targetTimeAC,
                this.msecTransTimeAC
              );
            }
            else if (settingString === 'OFF') {
              /*
                OFF procedure.
              */
             console.info('[INFO] All timers are canceled.')
              this.jobInvokeHue.cancel()
              this.jobInvokeAC.cancel();
            }
            else if (settingString === 'SYSTEM_MESSAGE') {
              /*
                SYSTEM_MESSAGE procedure.
              */
            }
            else if (settingString === 'UNEXPECTED') {
              /*
                UNEXPECTED procedure.
              */
              console.warn(
                `[Warn] No valid setting has been recieved.`
              )
            }
          }
        }.bind(this))
        .catch(e => {console.log(e)})
    }.bind(this))
  }
 
  turnOnHueTargetGroup () {

    // Hue API.
    var hueApi = `http://${this.hueBridgeIp}/api/${this.username}/groups/${this.groupId}/action`

    axios
      .put(hueApi, {
        "on": true,
        "transitiontime": Math.round((this.msecTransTimeHueBefore+this.msecTransTimeHueAfter)/100),
        "bri": this.brightness
      })
      .then(function (response) {
        console.info(
          `[INFO] Hue light API has been invoked at ${new Date()}.`
        )
      })
      .catch(e => {console.log(e)})
  }

  turnOnAirConditioner () {
    this.getRoomTemperature(this.remoDeviceId)
      .then(roomTemp => {
        console.info(
          `[INFO] Current room temparature is ${roomTemp} C on ${new Date()}.`
        )
        if (roomTemp < this.lowTempThreshold) {
          // this.turnOnDelonghi()
          this.turnOnHeater()
        }
        else if (roomTemp > this.highTempThreshold) {
          this.turnOnCooler()
        }
        else {
          console.info('[INFO] Air condition is good, and no equipment will be turned on.')
        }
      })
      .catch(e => {console.log(e)})
  }

  turnOnDelonghi () {
    var headers = {
      'Authorization': `Bearer ${this.remoApiToken}`,
      'accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    axios({
      method  : 'POST',
      url     : `https://api.nature.global/1/signals/${this.delonghiOnSignalId}/send`,
      headers : headers,
    })
      .then(function (response) {
        console.info(
          `[INFO] Nature Remo API for the De'Longhi has been invoked at ${new Date()}.`
        )
      })
      .catch(e => {console.log(e)})
  }

  turnOnCooler () {
    var headers = {
      'Authorization': `Bearer ${this.remoApiToken}`,
      'accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    axios({
      method  : 'POST',
      url     : `https://api.nature.global/1/appliances/${this.coolerOnSignalId}/aircon_settings`,
      data    : {
        button: null,
        operation_mode: 'cool', // 'auto', 'cool'
        temperature: 26,
        air_volume: 1
      },
      headers : headers,
    })
      .then(function (response) {
        console.info(
          `[INFO] Nature Remo API for the cooler has been invoked at ${new Date()}.`
        )
      })
      .catch(e => {console.log(e)})
  }

  turnOnHeater () {
    var headers = {
      'Authorization': `Bearer ${this.remoApiToken}`,
      'accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    axios({
      method  : 'POST',
      url     : `https://api.nature.global/1/appliances/${this.coolerOnSignalId}/aircon_settings`,
      data    : {
        button: null,
        operation_mode: 'warm', // 'auto', 'cool'
        temperature: 23,
        air_volume: 1
      },
      headers : headers,
    })
      .then(function (response) {
        console.info(
          `[INFO] Nature Remo API for the heater has been invoked at ${new Date()}.`
        )
      })
      .catch(e => {console.log(e)})
  }

  getRoomTemperature (specifiedDeviceId) {
    return new Promise( function (resolve, reject) {

      var headers = {
        'Authorization': `Bearer ${this.remoApiToken}`,
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      
      axios({
        method  : 'GET',
        url     : 'https://api.nature.global/1/devices',
        headers : headers,
      })
        .then(function (response) {

          // Get room temperature of the specified Nature Remo.
          var deviceData = this.getSpecifiedRemoData(specifiedDeviceId, response.data)
          var roomTemp = deviceData.newest_events.te.val
          resolve (roomTemp)

        }.bind(this))
        .catch(e => {reject(e)})
    }.bind(this))
  }

  getSpecifiedRemoData (specifiedDeviceId, deviceList) {
    for ( var device of deviceList ) {
      if (specifiedDeviceId === device.id) {
        return device
      }
    }
  }
}

var scheduler = new WakeUpRoutine(setting)
scheduler.start()
