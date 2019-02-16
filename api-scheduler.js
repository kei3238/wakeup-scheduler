module.exports = class ApiScheduler {
  
   setInvokeTimer (name, timer, targetTime, transitionTime) {
     // Calculate the time to invoke prior to the targetTime.
     var [hour, minute] = this.calculateInvokeTime(targetTime, transitionTime)
     
     // Set timer.
     timer.reschedule(`${minute} ${hour} * * *`)
 
     console.log(
       `[INFO] ${name} timer setting has been updated. New invoke time is ${hour}:${minute}.`
     )
   }
 
   calculateInvokeTime (targetTime, transitionTime) {
     // Calculate the time transitionTime before targetTime.
     targetTime.setMilliseconds(
       targetTime.getMilliseconds() - transitionTime
     );
 
     var hour   = targetTime.getHours();
     var minute = targetTime.getMinutes();
     [hour, minute] = this.zeroPadding(hour, minute);
 
     return [hour, minute]
   }
 
   getTargetTimeStamp (timeString) {
     // Set target time at which API calls will be made.
     var hour   = timeString.split(':')[0];
     var minute = timeString.split(':')[1];
     [hour, minute] = this.zeroPadding(hour, minute)
 
     console.info(`[INFO] New target time has been set to ${hour}:${minute}`)
 
     var targetTime = new Date();
     targetTime.setHours(hour);
     targetTime.setMinutes(minute);
     targetTime.setSeconds(0);
     targetTime.setMilliseconds(1000);
 
     return targetTime
   }
 
   checkSettingValue (settingStr) {
     if (settingStr.match(/[SYSTEM MESSAGE]/)) {
         return {valid: false, result: 'SYSTEM_MESSAGE'};
     }
     else if (settingStr === 'OFF' | 'Off' | 'off' | 'オフ') {
         return {valid: true, result: 'OFF'};
     }
     else if (this.checkTimeIsValid(settingStr)) {
         return {valid: true, result: 'TIME'};
     }
     else {
         return {valid: false, result: 'UNEXPECTED'};
     }
   }
  
   checkTimeIsValid (timeStr) {
 
     function isValidTime(timeStr) {
 
       var hour   = timeStr.split(':')[0]
       var minute = timeStr.split(':')[1]
 
       var tm = new Date('1970', 0, 1, hour, minute);
       return (tm.getHours()==hour && tm.getMinutes()==minute);
     }
 
     if (timeStr.match(/^\d{2}:?\d{2}$/) || timeStr.match(/^\d{1}:?\d{2}$/)) {
       if (isValidTime(timeStr)) {
         return true;
       }
       else {
         return false;
       }
     }
     else {
       return false;
     }
   }
   
   zeroPadding (hour, minute) {
     return [
       ('0' + hour  ).slice(-2),
       ('0' + minute).slice(-2)
     ]
   }
 }