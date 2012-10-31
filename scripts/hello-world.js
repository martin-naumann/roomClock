// JavaScript Document

var google_client_id = "";
var google_client_secret = "";
var google_api_key = "";
//Automatically fetched:
var google_refresh_token = null;
var google_token = null;
var firstRequest = [true, true, true];

var calendars = [
];

// Wait for PhoneGap to load
document.addEventListener("deviceready", onDeviceReady, false);

// PhoneGap is ready
function onDeviceReady() {
    
    for(var i=1, len = calendars.length; i < len; i++) {
        $("#tabstrip-calendar0").clone(true).attr("id","tabstrip-calendar" + i).insertAfter("#tabstrip-calendar0");
    }
    
    $("#footer-items, #footer-android-items").empty()
    for(var j=0, len = calendars.length; j < len; j++)  {
        $("#footer-items, #footer-android- items").append("<a href=\"#tabstrip-calendar" + j + "\"data-icon=\"globe\"><span id=\"tabstrip"+j+"\">Calendar</span</a>");
    }
    $("#footer-items").kendoMobileTabStrip();
    
    //When the callback URL is loading, we jump in and grab the code from the URL
    if(!window.plugins || !window.plugins.childBrowser) ChildBrowser.install();
    window.plugins.childBrowser.onLocationChange = function(returnUrl) {
        var code = returnUrl.match(/code=([^&]*)/);
        if(code[1] != undefined) {
          getTokensFromCode(code[1]);
          window.plugins.childBrowser.close(); //Close the useless window and grab all the calendars!
        }
    };
    
    var url = "https://accounts.google.com/o/oauth2/auth?scope=https://www.google.com/calendar/feeds/&response_type=code&redirect_uri=http://www.geekonaut.de/&access_type=offline&approval_prompt=force&client_id=" + google_client_id;
    window.plugins.childBrowser.showWebPage(url);

}

function getTokensFromCode(code) {
    $.post("https://accounts.google.com/o/oauth2/token", {
            "code": code,
            "client_id": google_client_id,
            "client_secret": google_client_secret,
            "redirect_uri": "http://www.geekonaut.de/",
            "grant_type": "authorization_code"
        }, function(result) {
            google_token = result.access_token;
            google_refresh_token = result.refresh_token;
            setTimeout("getNewAccessToken()", (result.expires_in - 10) * 1000);
            
            for(var i=0, len = calendars.length; i < len; i++) {
                getCalendarEvents(calendars[i], i, google_token);
            }
    });
}

function getNewAccessToken() {
    $.post("https://accounts.google.com/o/oauth2/token", {
            "refresh_token": google_refresh_token,
            "client_id": google_client_id,
            "client_secret": google_client_secret,
            "grant_type": "refresh_token"
        }, function(result) {
            google_token = result.access_token;
            setTimeout("getNewAccessToken()", (result.expires_in - 10) * 1000);
        }); //.error(function(xhr) { alert("ERROR: Cannot refresh the access token (" + xhr.responseText + ")") });    
}

function getCalendarEvents(calendar, index) {
    //Get only the next or currently running event
    var now = new Date();
    var dateTimeString = now.getFullYear() +"-"+ (now.getMonth()+1) + "-" + now.getDate() +"T"+ now.getHours() + ":" + now.getMinutes() + ":00+01:00" ;
    $.ajax({
        url: "https://www.googleapis.com/calendar/v3/calendars/" + calendar + "/events?access_token=" + google_token,
        datatype : "json",
        data: {
            "orderBy": "startTime",
            "singleEvents": true,
            "key": google_api_key,
            "timeMin": dateTimeString
            }
    })
    .done(function(result) {
        if(result.error) {
            $("#tabstrip-calendar" + index + " div.eventContainer").text(result.error.message + " :(");
        } else {

            if(firstRequest[index]) {
                $("#tabstrip-calendar" + index + " h1, #tabstrip" + index).text(result.summary);
                firstRequest[index] = false;
            }
            
            if(!result.items[0] || !result.items[0].summary) {
                $("#tabstrip-calendar" + index + " .eventContainer").text("Occupied");
            }
            else {
                $("#tabstrip-calendar" + index + " .eventContainer").text(result.items[0].summary);            
            }
            
            var startDate = new Date(result.items[0].start.dateTime);
            var startString = ("0" + startDate.getHours()).slice(-2) + ":" + ("0" + startDate.getMinutes()).slice(-2);
            var endDate = new Date(result.items[0].end.dateTime);
            var endString = ("0" + endDate.getHours()).slice(-2) + ":" + ("0" + endDate.getMinutes()).slice(-2);
            
            var timeString = startString + " to " + endString;
            if(startDate.getDate() != new Date().getDate()) timeString ="On the " + ("0" + startDate.getDate()).slice(-2) + "/" + ("0" + (startDate.getMonth() + 1)).slice(-2) + " from " + timeString;
            
            $("#tabstrip-calendar" + index + " .eventTime").text(timeString);
        }
    }); //.fail(function(xhr, complaint) { alert("ERROR:" + xhr.responseText + " D:"); });
    
    setTimeout(function() { getCalendarEvents(calendar, index); }, 60000);
}