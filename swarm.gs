var FQ_ID = "<FOURSQUARE_ID>";
var FQ_SECRET = "<FOURSQUARE_SECRET>";

var FQ_ACCESS_TOKEN = "access_token";

var WEB_URL = "<Google Apps Script Web Application URL>";
var REDIRECT_URI = WEB_URL;
var REGISTERED_URI = WEB_URL;

var SWARM_LOGIN_PAGE = "<a target=\"_blank\" href=\"{URL}\">こちら</a>";
var OK_CODE_CONTENT = "[OK] code: {CODE}";
var OK_ACCESS_TOKEN_CONTENT = "[OK] access_token: {ACCESS_TOKEN}";

var OAUTH2_URL = "https://foursquare.com/oauth2/authenticate?client_id={FQ_ID}&response_type=code&redirect_uri={REDIRECT_URI}";
var OAUTH2_2_URL = "https://foursquare.com/oauth2/access_token?client_id={FQ_ID}&client_secret={FQ_SECRET}&grant_type=authorization_code&redirect_uri={YOUR_REGISTERED_REDIRECT_URI}&code={CODE}";
var OAUTH_PARTS = "oauth_token={ACCESS_TOKEN}";

var V_PARAMS = "v={V_PARAMS}";
var M_PARAMS = "m={M_PARAMS}";

var USER_VENUE_HISTORY = "https://api.foursquare.com/v2/users/{USER_ID}/venuehistory";
var BEFORE_TIMESTAMP = "beforeTimestamp={BEFORE_TIMESTAMP}";
var AFTER_TIMESTAMP = "afterTimestamp={AFTER_TIMESTAMP}";
var CATEGORY_ID = "categoryId={CATEGORY_ID}";

var USER_CHECKINS = "https://api.foursquare.com/v2/users/{USER_ID}/checkins";
var LIMIT = "limit={LIMIT}";
var OFFSET = "offset={OFFSET}";
var SORT = "sort={SORT}";

var SPREADSHEET_ID = "<Database Spreadsheet ID>";
var SHEET_DATA_NAME = "data";
var SHEET_CONFIG_NAME = "config";

function makeJoint(url) {
  return (url.indexOf("?") === -1) ? "?" : "&";
}

function checkins(userId, limit, offset, sort, afterTimestamp, beforeTimestamp) {
  var url = USER_CHECKINS;
  if (!userId) {
    userId = "self";
  }
  url = url.replace("{USER_ID}", userId);
  if (limit) {
    url += makeJoint(url) + LIMIT.replace("{LIMIT}", limit);
  }
  if (offset) {
    url += makeJoint(url) + OFFSET.replace("{OFFSET}", offset);
  }
  if (sort) {
    url += makeJoint(url) + SORT.replace("{SORT}", sort);
  }
  if (afterTimestamp) {
    url += makeJoint(url) + AFTER_TIMESTAMP.replace("{AFTER_TIMESTAMP}", afterTimestamp);
  }
  if (beforeTimestamp) {
    url += makeJoint(url) + BEFORE_TIMESTAMP.replace("{BEFORE_TIMESTAMP}", beforeTimestamp);
  }
  return baseAPI(url);
}

function venueHistory(userId, beforeTimestamp, afterTimestamp, categoryId) {
  var url = USER_VENUE_HISTORY;
  if (!userId) {
    userId = "self";
  }
  url = url.replace("{USER_ID}", userId);

  if (beforeTimestamp) {
    url += makeJoint(url) + BEFORE_TIMESTAMP.replace("{BEFORE_TIMESTAMP}", beforeTimestamp);
  }
  if (afterTimestamp) {
    url += makeJoint(url) + AFTER_TIMESTAMP.replace("{AFTER_TIMESTAMP}", afterTimestamp);
  }
  if (categoryId) {
    url += makeJoint(url) + CATEGORY_ID.replace("{CATEGORY_ID}", categoryId);
  }
  return baseAPI(url);
}

function baseAPI(url) {
  var token = PropertiesService.getUserProperties().getProperty(FQ_ACCESS_TOKEN);
  var authorizedUrl = url + makeJoint(url) + OAUTH_PARTS.replace("{ACCESS_TOKEN}", token);
  authorizedUrl = authorizedUrl + "&" + V_PARAMS.replace("{V_PARAMS}", "20170307") + "&" + M_PARAMS.replace("{M_PARAMS}", "swarm");
  Logger.log(authorizedUrl);
  var response = UrlFetchApp.fetch(authorizedUrl);
  var contents = JSON.parse(response.getContentText());
  return contents;
}

function doGet(e) {
  if (isSwarm(e)) {
    return HtmlService.createHtmlOutput(
      SWARM_LOGIN_PAGE.replace("{URL}",
        OAUTH2_URL.replace("{FQ_ID}", FQ_ID)
                  .replace("{REDIRECT_URI}", REDIRECT_URI)
      )
    );
  }
  if (hasCode(e)) {
    var code = e.parameter.code;
    var url = OAUTH2_2_URL.replace("{FQ_ID}", FQ_ID)
                          .replace("{FQ_SECRET}", FQ_SECRET)
                          .replace("{YOUR_REGISTERED_REDIRECT_URI}", REGISTERED_URI)
                          .replace("{CODE}", code);
    var response = UrlFetchApp.fetch(url);
    var contents = JSON.parse(response.getContentText());

    if (contents.access_token) {
      var token = contents.access_token;
      PropertiesService.getUserProperties().setProperty(FQ_ACCESS_TOKEN, token);
      return ContentService.createTextOutput(
        OK_ACCESS_TOKEN_CONTENT.replace("{ACCESS_TOKEN}", token)
      );
    }
    return ContentService.createTextOutput(
      OK_CODE_CONTENT.replace("{CODE}", e.parameter.code)
    );
  }
  return ContentService.createTextOutput(JSON.stringify(e)).setMimeType(ContentService.MimeType.JSON);
}

function hasAccessToken(e) {
  if (e.parameter.access_token) {
    return true;
  }
  return false;
}

function hasCode(e) {
  if (e.parameter.code) {
    return true;
  }
  return false;
}

function isSwarm(e) {
  if (e.parameter.swarm) {
    return true;
  }
  return false;
}

function getAllCheckins() {
  var spreadSheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadSheet.getSheetByName(SHEET_DATA_NAME);
  var sum = 0;
  while (true) {
    var contents = checkins(null, 250, sum);
    var response = contents.response;
    var checkinItems = response.checkins.items;
    for (var i = 0; i < checkinItems.length; i++) {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1).setValue(JSON.stringify(checkinItems[i]));
    }
    sum += checkinItems.length;
    if (sum >= response.checkins.count) {
      break;
    }
  }
}

function getCheckins() {
  var spreadSheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadSheet.getSheetByName(SHEET_DATA_NAME);
  var config = spreadSheet.getSheetByName(SHEET_CONFIG_NAME);
  var contents = checkins(null, 250, null, null, 1 + parseInt(JSON.parse(config.getRange(2, 1).getValue())));
  var response = contents.response;
  var checkinItems = response.checkins.items.reverse();
  for (var i = 0; i < checkinItems.length; i++) {
    sheet.getRange(sheet.getLastRow() + 1, 1).setValue(JSON.stringify(checkinItems[i]));
  }
  if (response.checkins.items.length > 0) {
    config.getRange(2, 1).setValue(JSON.stringify(response.checkins.items[0].createdAt));
  }
  config.getRange(2, 3).setValue(JSON.stringify(response.checkins.count));
}
