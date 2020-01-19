var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var utils = require('coloringautils')

var write = require('coloringautils/writefile')
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/readyoutube-cred.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'readyoutube-cred.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API.
  authorize(JSON.parse(content), getChannel);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

var query = 'slime';

var dateBefore = '2018-11-20T00:00:25-07:00'
var dateAfter = '2018-11-20T23:59:25-07:00'


//first of dst2

var dateBeforeUnix = utils.YTmomentToUnix(dateBefore);
var dateAfterUnix = utils.YTmomentToUnix(dateAfter);

var global = require('./global')
var info = require('./../maps/places/places.json');

var randomPlace = utils.getRandom(0, info.length-1);

var lat = global.getLat(randomPlace)
var lng = global.getLng(randomPlace)
var location = global.getLocation(randomPlace).replace(/\s/g, '');

var datesCollected = [];

var latlngs = require('./locations/latlngs.json')
latlngs.push({lat: lat, lng: lng, location: location, dateBefore: dateBeforeUnix, dateAfter: dateAfterUnix})
write.write(latlngs, './locations/latlngs.json')

function getChannel(auth) {

  var service = google.youtube('v3');
  service.search.list({
      auth: auth,
      q: 'o',
      location: lat+', '+lng,
      locationRadius: '100km',
    order: 'date',
    type: 'video,list',
      part: 'snippet',
      publishedAfter: dateAfter,
      publishedBefore: dateBefore
  }).then(res=>{
    var newArr = res['data']['items'];

    datesCollected.push({dateBefore: dateBeforeUnix, dateAfter: dateAfterUnix})

    write.write(datesCollected, './dates_collected/dates_collected_'+location+'.json')
      write.write(newArr, './fromqs/'+query+'_'+dateBeforeUnix+'_'+dateAfterUnix+'_'+location+'.json')
      var authorize = [];
      authorize.push({auth:auth, randomPlace: randomPlace, lat:lat, lng:lng, location:location, dateBeforeUnix: dateBeforeUnix, dateAfterUnix, dateBefore:dateBefore, dateAfter: dateAfter})
      write.write(authorize, './authorization.json');

  })
}
