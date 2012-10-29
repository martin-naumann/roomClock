// JavaScript Document

var google_client_id = "";
var google_client_secret = "";
var google_api_key = "";
var google_token = null;

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
        var code = returnUrl.match(/access_token=([^&]*)/);
        if(code[1] != undefined) {
            google_token = code[1];
          window.plugins.childBrowser.close(); //Close the useless window and grab all the calendars!
          for(var i=0, len = calendars.length; i < len; i++) {
            getCalendarEvents(calendars[i], i, google_token);
          }
        }
    };
    
    var url = "https://accounts.google.com/o/oauth2/auth?scope=https://www.google.com/calendar/feeds/&response_type=token&redirect_uri=http://www.geekonaut.de/&client_id=" + google_client_id;
    window.plugins.childBrowser.showWebPage(url);

}

function getCalendarEvents(calendar, index, token) {
    //Get only the next or currently running event
    var now = new Date();
    var dateTimeString = now.getFullYear() +"-"+ (now.getMonth()+1) + "-" + now.getDate() +"T"+ now.getHours() + ":" + now.getMinutes() + ":00+01:00" ;
    $.ajax({
        url: "https://www.googleapis.com/calendar/v3/calendars/" + calendar + "/events?access_token=" + token,
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

            $("#tabstrip-calendar" + index + " h1, #tabstrip" + index).text(result.summary);
            $("#tabstrip-calendar" + index + " .eventContainer").text(result.items[0].summary);
            
            var startDate = new Date(result.items[0].start.dateTime);
            var startString = ("0" + startDate.getHours()).slice(-2) + ":" + ("0" + startDate.getMinutes()).slice(-2);
            var endDate = new Date(result.items[0].end.dateTime);
            var endString = ("0" + endDate.getHours()).slice(-2) + ":" + ("0" + endDate.getMinutes()).slice(-2);
            
            var timeString = startString + " to " + endString;
            if(startDate.getDate() != new Date().getDate()) timeString ="On the " + ("0" + startDate.getDate()).slice(-2) + "/" + ("0" + startDate.getMonth()).slice(-2) + " from " + timeString;
            
            $("#tabstrip-calendar" + index + " .eventTime").text(timeString);
        }
    }).fail(function(xhr, complaint) { alert("ERROR:" + xhr.responseText + " D:"); });

    setTimeout(function() { getCalendarEvents(calendar, index, token); }, 60000);
}
