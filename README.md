# swarm-apps

## Settings

```
var FQ_ID = "<FOURSQUARE_ID>";
var FQ_SECRET = "<FOURSQUARE_SECRET>";
var WEB_URL = "<Google Apps Script Web Application URL>";
var SPREADSHEET_ID = "<Database Spreadsheet ID>";
```

### Config Sheet Range(2, 2)

```
=(A2 + 32400) / 86400 + 25569
```

### Run

```
getCheckins
```

## Start

```
<Google Apps Script Web Application URL>?swarm=true
```

## Scope

```
https://www.googleapis.com/auth/script.external_request
https://www.googleapis.com/auth/script.storage
https://www.googleapis.com/auth/spreadsheets
```
