const axios = require('axios')
const qs = require('qs')
const fs = require('fs')

// Read settings.
const setting = require('./setting.json')

// Hue API settings.
const hueBasic64Token = setting.hue.basic64Token
const hueClientId = setting.hue.clientId
const hueClientSecret = setting.hue.clientSecret
const hueRefreshToken = setting.hue.refreshToken

// Hue API.
var hueApi = 'https://api.meethue.com/oauth2/refresh'
var headers = {
  'Authorization': `Basic ${hueBasic64Token}`,
  'Content-Type': 'application/x-www-form-urlencoded'
};

axios({
  method: 'POST',
  url: hueApi,
  auth: {
    username: hueClientId,
    password: hueClientSecret
  },
  params: {
    grant_type: 'refresh_token'
  },
  data: qs.stringify({
    'refresh_token': hueRefreshToken
  }),
  headers : headers,
})
  .then(function (response) {
    console.info(response.data)
    setting.hue.accessToken = response.data.access_token
    setting.hue.refreshToken = response.data.refresh_token

    // Update setting file.
    fs.writeFile(
      'setting.json',
      JSON.stringify(setting, '', '  '),
      (e) => { if (e) console.log(e) }
    )
  })
  .catch(e => {console.log(e)})