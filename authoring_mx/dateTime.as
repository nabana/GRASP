#include "RegExp.as"

// converts a Date object to a formatted string in ISO 8601 format
function dateToiso8601(t) {
    var year  = t.getYear();
    if (year < 2000)   year = year + 1900;
    var month = t.getMonth() + 1;
    var day  = t.getDate();
    var hour = t.getHours();
    var hourUTC = t.getUTCHours();
    var diff = hour - hourUTC;
    var hourdifference = Math.abs(diff);
    var minute = t.getMinutes();
    var minuteUTC = t.getUTCMinutes();
    var minutedifference;
    var second = t.getSeconds();
    var timezone;
    if (minute != minuteUTC && minuteUTC < 30 && diff < 0) { hourdifference--; }
    if (minute != minuteUTC && minuteUTC > 30 && diff > 0) { hourdifference--; }
    if (minute != minuteUTC) {
        minutedifference = ":30";
    } else {
        minutedifference = ":00";
    }
    if (hourdifference < 10) { 
        timezone = "0" + hourdifference + minutedifference;
    } else {
        timezone = "" + hourdifference + minutedifference;
    }
    if (diff < 0) {
        timezone = "-" + timezone;
    } else {
        timezone = "+" + timezone;
    }
    if (month <= 9) month = "0" + month;
    if (day <= 9) day = "0" + day;
    if (hour <= 9) hour = "0" + hour;
    if (minute <= 9) minute = "0" + minute;
    if (second <= 9) second = "0" + second;
    return year + '-' + month + '-' + day + "T" + hour + ":" + minute + ":" + second + timezone;
}

// converts a formatted string in ISO 8601 format to a Javascript date object
function iso8601Todate(s) {
    var year, month, day, hours, mins, secs;
//  var ex = "^(\d{4})-?(\d{2})-?(\d{2})T(\d{2}):?(\d{2}):?(\d{2})(([-\+]\d{1,2}:?\d{2})|(Z))?$";
    var ex = "^(\\d{4})-?(\\d{2})-?(\\d{2})T(\\d{2}):?(\\d{2}):?(\\d{2})"
    var re = new RegExp(ex)
    var grps = re.exec(s)
    year = parseInt(grps[1])
    month = parseInt(grps[2]) - 1
    day = parseInt(grps[3])
    var now = new Date()
    var tzo = now.getTimezoneOffset() / 60
    hours = parseInt(grps[4]) + tzo
    mins = parseInt(grps[5])
    secs = parseInt(grps[6])
    return new Date(Date.UTC(year, month, day, hours, mins, secs))
}

