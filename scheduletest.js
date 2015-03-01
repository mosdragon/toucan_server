var schedule = require('node-schedule');
var date = new Date();

date.setSeconds(date.getSeconds() + 3);
 
var j = schedule.scheduleJob(date, function(){
    console.log('One minute later');
});