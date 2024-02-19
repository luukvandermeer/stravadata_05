//VARIABLES & METRICS
// d3.csv('allData_Edmund.csv').then(function(data) {
d3.csv('csvFiles/allGiro_Luuk.csv').then(function(data) {

//ROLLUPS DAYS METRICS
  var arrayDays = d3.nest()
      .key(function(d) {return (d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted)))})
      .rollup(function (values) {return {
        stages: d3.max(values, function (d)
        {if ((d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))) === "16") {return "STAGE I";} 
        else if ((d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))) === "17") {return "STAGE II";} 
        else if ((d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))) === "18") {return "STAGE III";} 
        else if ((d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))) === "19") {return "STAGE IV";} 
        else if ((d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))) === "20") {return "STAGE V";}  
    else return ("Test");


  }),       
        distance: d3.max(values, function(d) {return ((+d.distance)/1000);}), //changing to number (+)
        elevation: d3.sum(values, function(d, i, arr) {if (i === 0) return 0; 
        var diff = d.enhanced_altitude - arr[i-1].enhanced_altitude; return diff > 0 ? diff : 0;}),
        heart_rate: d3.mean(values, function(d) {return d.heart_rate;}),
        time: d3.max(values, function(d) {return (d3.timeFormat("%H:%M:%S")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted)))}),
        duration: d3.timeFormat('%-H:%M:%S')( new Date(0).setSeconds((d3.count(values, d => d.enhanced_speed))-3600)), //Calculate all entries as duration, seems to be adding extra hour
        pace: d3.mean(values, function (d) {if (d.enhanced_speed > 1){return d.enhanced_speed}}), //Infintity excludes zero values
        power: d3.mean(values, function(d) {if (d.power <= 2000){return d.power}}), //Remove odd numbers
        heartRate: d3.mean(values, function(d)  {if (d.heart_rate || Infinity){return d.heart_rate}}), //Infintity excludes zero values
        cadance: d3.mean(values, function(d) {if (d.cadence > 1){return d.cadence}}) //Infintity excludes zero values
      }})
      .entries(data);

console.log(arrayDays);

//TOTAL METRICS
const totalDistance = d3.sum(arrayDays, function(d) {return d.value.distance})
const totalElevation = d3.sum(arrayDays, function(d) {return d.value.elevation})
const totalTime = d3.sum(arrayDays, function(d) {return (d3.timeParse("%H:%M:%S")(d.value.time)).getHours() + (d3.timeParse("%H:%M:%S")(d.value.time).getMinutes()/60);});
const totalDuration = (d3.count(data, d => d.enhanced_speed)/3600)
const totalPace =  d3.mean(data, function (d) {if (d.enhanced_speed || Infinity){return d.enhanced_speed}})//Infintity excludes zero values
const totalPower = d3.mean(data, function(d) {if (d.power <= 2000){return d.power}})//Infintity excludes zero values
const totalHeartRate =  d3.mean(data, function(d)  {if (d.heart_rate || Infinity){return d.heart_rate}})//Infintity excludes zero values
const totalCadence = d3.mean(data, function(d) {if (d.cadence >1){return d.cadence}})//Infintity excludes zero values

//ADD CONST TO SPAN
d3.select(".totalDistance").text(d3.format(",.0f")(totalDistance))
d3.select(".totalElevation").text(d3.format(",.0f")(totalElevation))
d3.select(".totalTime").text(d3.format(",.1f")(totalTime))
d3.select(".totalDuration").text(d3.format(",.1f")(totalDuration))
d3.select(".totalPace").text(d3.format(",.2f")(totalPace))
d3.select(".totalPower").text(d3.format(",.0f")(totalPower))
d3.select(".totalHeartRate").text(d3.format(",.0f")(totalHeartRate))
d3.select(".totalCadence").text(d3.format(",.0f")(totalCadence))

var metricDay = d3.select("metrics").append("metricDay")


metricDay.selectAll("li")
.data(arrayDays)
.enter()
.append("li")
.text(function (d,i) {return d.value.stages + " | MAY " + d.key +  ", " 
  +(d3.format(",.0f")(d.value.distance)) +"km,  " 
+(d3.format(",.0f")(d.value.elevation)) +"hm,  " 
  +((d3.timeFormat("%H:%M")(d3.timeParse("%H:%M:%S")(d.value.time)))) +"h,  "  
  +((d3.timeFormat("%H:%M")(d3.timeParse("%H:%M:%S")(d.value.duration)))) +"h,  "  
  +(d3.format(",.1f")(d.value.pace)) +"kmh,  " 
  +(d3.format(",.0f")(d.value.power)) +"nP, "
  +(d3.format(",.0f")(d.value.heartRate)) +"hr,  "
  +(d3.format(",.0f")(d.value.cadance)) +"rpm"
})


});
