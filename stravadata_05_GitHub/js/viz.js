////////////////////////////////
///////ELEVATIONCHART//////////
////////////////////////////////
d3.csv('csvFiles/allGiro_Luuk.csv').then(function(data) {

const margin = 20,
  width = 555,
  height = 545;

const elevationProfile = d3.select("#elevationProfile")
      // .append('svg')
      .attr('width', width + 'px')
      .attr('height', height + 'px')  
      // .translate([-10,260])
      .append("g");



// CLEANING UP SOME DATA
const totalHeartRate =  d3.mean(data, function(d)  {if (d.heart_rate || Infinity){return d.heart_rate}})//Infintity excludes zero values
const totalPower = d3.mean(data, function(d) {if (d.power <= 2000){return d.power}})//Infintity excludes zero values


//ROLLUPS ELEVATION METRICS
  const arrayElevation = d3.nest()
      .key(function(d) {return d3.format(".0f")(d.final_distance/1000)}) //divide by 1000 to calculate into kms     
      .rollup(function (values) {return {
        timestamp: d3.max(values, function (d) {return d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))}),
        timestampMin: d3.min(values, function (d) {return d3.timeFormat("%H:%M:%S")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))}),
        elevation: d3.max(values, function(d) {return ((d.enhanced_altitude));}),
        speed: d3.max(values, function(d) {return ((d.enhanced_speed));}),
        distance: d3.min(values, function(d) {return ((d.final_distance/1000));}),
        heartRate: d3.max(values, function(d) {if (d.heart_rate < 250) {return d.heart_rate;} else {return totalHeartRate;}}),
        cadence: d3.max(values, function(d) {return ((d.cadence));}),
        power: d3.max(values, function(d) {if (d.power < 1900) {return d.power;} else {return totalPower;}}), //Check if values are okay,
      }})
      .entries(data);

console.log(arrayElevation);

//CREATE SCALE
  yScale = d3.scaleLinear() // CHECK YSCALE!!!!
      .domain([d3.max(arrayElevation, d => d.value.elevation),420])
      .range([260,((height)/2)+margin+6]);

    xScale = d3.scaleLinear()
    .domain([0,(d3.max(arrayElevation, d=> d.value.distance))])
    .range([0+margin,width-margin-2]);

const lineProfile = elevationProfile.append("path")
              .datum(arrayElevation.filter(function (d) {return d.key !== 'NaN'; })) //REMOVE NAN ROLL-UPS
              .attr("class", "area")
              // .attr("fill", "#D5BAB6")
              .attr("d", d3.area()
                  .x(function(d) {
                    if (d.key || Infinity ){return xScale(d.key)}})
                  .y0(yScale(0))
                  .y1(function(d) {
                    return d.value.elevation ? yScale(d.value.elevation) : 0;
                  })
               
              )
               .style('fill','#D5BAB6');



////////////////////////////////
///VERTICAL DAY INDICATORS////
////////////////////////////////
const verticalLines = elevationProfile
  .selectAll('.vertical-line')
  .data(arrayElevation.filter(function(d) { return d.value.timestampMin == "00:00:00"; }))
  .enter()
  .append('line')
  .attr('class', 'vertical-line')
  .attr('x1', function(d) {return xScale(d.key)})
  .attr('x2', function(d) {return xScale(d.key)})
  .attr('y1', margin)
  .attr('y2', height - margin)
  .style("stroke-width", function(d) {
    if (d.key == 0) {
      return 0;
    } else {
      return 2;
    }
  })
  .style('stroke', '#FFF')
  .style("stroke-dasharray", "2,2")
  .style("opacity", .4);



////////////////////////////////
///////STACKED AREA CHART///////
////////////////////////////////
yScaleStacked = d3.scaleLinear() // CHECK YSCALE!!!!
      .domain([-400, d3.max(arrayElevation, d => d.value.elevation)])
      .range([((height)/2)+margin, 410]);

// Combine the data arrays into a single array for the stack layout
const stackedData = arrayElevation.filter(function(d) { return d.key !== 'NaN'; });

const stack = d3.stack()
    .keys(["speed", "power", "heartRate", "cadence"])
    .value((d, key) => d.value[key] || 0);

const stackedValues = stack(stackedData);

const areaGenerator = d3.area()
    .x(d => xScale(d.data.key))
    .y0(d => yScaleStacked(d[0]))
    .y1(d => yScaleStacked(d[1]))
    .curve(d3.curveBasis);

// Append the stacked areas
const stackedAreas = elevationProfile.selectAll(".stackedArea")
    .data(stackedValues)
    .enter()
    .append("path")
    .attr("class", (d, i) => ["speedProfile", "powerProfile", "heartRateProfile", "cadenceProfile"][i]) // Set class for styling
    .attr("d", areaGenerator)
    .attr("stroke", "#5D0100")
    .style("stroke-dasharray", ("1,1 "))
    .attr("stroke-width", .04)
    .style("fill", (d, i) => ["#BB9899", "#D5BAB6", "#E2CBC5", "#E8D1C8"][i]); // Set fill color

// Add the horizontal line
const lineHorizontal = elevationProfile.append('line')
    .attr('class', "Line")
    .attr('x1', xScale(0))
    .attr('x2', xScale(d3.max(arrayElevation, d => d.value.distance)+5))
    .attr('y1', yScaleStacked(0))
    .attr('y2', yScaleStacked(0))
    .style("stroke-width", 0.5)
    .style('stroke', '#6C3341');


const legendElevation = elevationProfile.append('text')
    .attr('class', "legend")
    .text("Elevation")
    .attr('x', xScale(d3.max(arrayElevation, d => d.value.distance)+4))
    .attr('y', yScaleStacked(-30))
    .style('fill', '#5D0100');

const legendSpeed = elevationProfile.append('text')
    .attr('class', "legend")
    .text("Speed")
    .attr('x', xScale(d3.max(arrayElevation, d => d.value.distance)+4))
    .attr('y', yScaleStacked(50))
    .style('fill', '#5D0100');


const legendPower = elevationProfile.append('text')
    .attr('class', "legend")
    .text("Power")
    .attr('x', xScale(d3.max(arrayElevation, d => d.value.distance)+4))
    .attr('y', yScaleStacked(100))
    .style('fill', '#5D0100');

const legendHeartRate = elevationProfile.append('text')
    .attr('class', "legend")
    .text("Heartrate")
    .attr('x', xScale(d3.max(arrayElevation, d => d.value.distance)+4))
    .attr('y', yScaleStacked(200))
    .style('fill', '#5D0100');

const legendCadence = elevationProfile.append('text')
    .attr('class', "legend")
    .text("Cadence")
    .attr('x', xScale(d3.max(arrayElevation, d => d.value.distance)+4))
    .attr('y', yScaleStacked(295))
    .style('fill', '#5D0100');



//////////////////////////////
///////STAGE INDICATORS///////
/////////////////////////////

const stageIndicator = elevationProfile.selectAll('.stageIndicator')
  .data(arrayElevation.filter(function(d, i) { return d.value.timestampMin === "00:00:00"; }))
  .enter() 
  .append('text')
  .attr('class', 'stageIndicator')
  .text(function(d, i) {
    if (d.value.timestamp === "16") {
      return "Stage I";
    } else if (d.value.timestamp === "17") {
      return "Stage II";
    } else if (d.value.timestamp === "18") {
      return "Stage III";
    } else if (d.value.timestamp === "19") {
      return "Stage IV";
    } else if (d.value.timestamp === "20") {
      return "Stage V";
    } else {
      return "Test";
    }
  })
  .attr("x", function(d) { return xScale(d.value.distance +10); })
  .attr("y", 10+margin)
  .attr("fill", "#5D0100");

const stageIndicatorDetails = elevationProfile.selectAll('.stageIndicatorDetails')
  .data(arrayElevation.filter(function(d, i) { return d.value.timestampMin === "00:00:00"; }))
  .enter() 
  .append('text')
  .attr('class', 'stageIndicatorDetails')
  .text(function(d, i) {
    if (d.value.timestamp === "16") {
      return "Milan > Teligio";
    } else if (d.value.timestamp === "17") {
      return "Teligio > Silandro";
    } else if (d.value.timestamp === "18") {
      return "Silandro > Tesero";
    } else if (d.value.timestamp === "19") {
      return "Tesero > Auronzo";
    } else if (d.value.timestamp === "20") {
      return "Auronzo > Udine";
    } else {
      return "Test";
    }
  })
  .attr("x", function(d) { return xScale(d.value.distance +10); })
  .attr("y", 10+margin+8)
  .attr("fill", "#5D0100");



//////////////////////////////
///////STAGE VISUALIZATIONS///////
/////////////////////////////

// ROUTE VIZ
const projection = d3.geoIdentity()
    .reflectY(true)
    .translate([-120,950])
    .scale([20]);

const line = d3.line()
      .x(function(d) {return projection([d.position_long,d.position_lat])[0] ; })
      .y(function(d) {return projection([d.position_long,d.position_lat])[1]; })
      .curve(d3.curveBasis);

// Filtered data
const stageIData = data.filter(function(d) {
    return d.position_lat < 50 && d.position_long <= 19 && d.position_long > 0 && (d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))) == 16;
});

const linePathStageI = elevationProfile.append("path")
    .datum(stageIData)
    .attr("d", line)
    .attr("stroke", "#450101")
    .attr("stroke-width", 0.5)
    .attr("fill", "none")
    .attr('class', 'line')
    .attr("transform", "translate(10, 0)");

// Append circles at the end points
elevationProfile.append("circle")
    .attr("cx", projection([stageIData[0].position_long, stageIData[0].position_lat])[0])
    .attr("cy", projection([stageIData[0].position_long, stageIData[0].position_lat])[1])
    .attr("r", .65)
    .attr("fill", "450101")
        .attr("transform", "translate(10, 0)");

elevationProfile.append("circle")
    .attr("cx", projection([stageIData[stageIData.length - 1].position_long, stageIData[stageIData.length - 1].position_lat])[0])
    .attr("cy", projection([stageIData[stageIData.length - 1].position_long, stageIData[stageIData.length - 1].position_lat])[1])
    .attr("r", .65)
    .attr("fill", "450101")
        .attr("transform", "translate(10, 0)");


// Filtered data
const stageIIData = data.filter(function(d) {
    return d.position_lat < 50 && d.position_long <= 19 && d.position_long > 0 && (d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))) == 17;
});

const linePathStageII = elevationProfile.append("path")
    .datum(stageIIData)
    .attr("d", line)
    .attr("stroke", "#450101")
    .attr("stroke-width", 0.5)
    .attr("fill", "none")
    .attr('class', 'line')
    .attr("transform", "translate(115, 10)");

// Append circles at the end points
elevationProfile.append("circle")
    .attr("cx", projection([stageIIData[0].position_long, stageIIData[0].position_lat])[0])
    .attr("cy", projection([stageIIData[0].position_long, stageIIData[0].position_lat])[1])
    .attr("r", .65)
    .attr("fill", "450101")
        .attr("transform", "translate(115, 10)");

elevationProfile.append("circle")
    .attr("cx", projection([stageIIData[stageIIData.length - 1].position_long, stageIIData[stageIIData.length - 1].position_lat])[0])
    .attr("cy", projection([stageIIData[stageIIData.length - 1].position_long, stageIIData[stageIIData.length - 1].position_lat])[1])
    .attr("r", .65)
    .attr("fill", "450101")
        .attr("transform", "translate(115, 10)");

const stageIIIData = data.filter(function(d) {
    return d.position_lat < 50 && d.position_long <= 19 && d.position_long > 0 && (d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))) == 18;
});

const linePathStageIII = elevationProfile.append("path")
    .datum(stageIIIData)
    .attr("d", line)
    .attr("stroke", "#450101")
    .attr("stroke-width", 0.5)
    .attr("fill", "none")
    .attr('class', 'line')
    .attr("transform", "translate(225, 10)");

// Append circles at the end points
elevationProfile.append("circle")
    .attr("cx", projection([stageIIIData[0].position_long, stageIIIData[0].position_lat])[0])
    .attr("cy", projection([stageIIIData[0].position_long, stageIIIData[0].position_lat])[1])
    .attr("r", .65)
    .attr("fill", "450101")
    .attr("transform", "translate(225, 10)");

elevationProfile.append("circle")
    .attr("cx", projection([stageIIIData[stageIIIData.length - 1].position_long, stageIIIData[stageIIIData.length - 1].position_lat])[0])
    .attr("cy", projection([stageIIIData[stageIIIData.length - 1].position_long, stageIIIData[stageIIIData.length - 1].position_lat])[1])
    .attr("r", .65)
    .attr("fill", "450101")
    .attr("transform", "translate(225, 10)");




const stageIVData = data.filter(function(d) {
    return d.position_lat < 50 && d.position_long <= 19 && d.position_long > 0 && (d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))) == 19;
});

const linePathStageIV = elevationProfile.append("path")
    .datum(stageIVData)
    .attr("d", line)
    .attr("stroke", "#450101")
    .attr("stroke-width", 0.5)
    .attr("fill", "none")
    .attr('class', 'line')
    .attr("transform", "translate(295, 10)");

// Append circles at the end points
elevationProfile.append("circle")
    .attr("cx", projection([stageIVData[0].position_long, stageIVData[0].position_lat])[0])
    .attr("cy", projection([stageIVData[0].position_long, stageIVData[0].position_lat])[1])
    .attr("r", .65)
    .attr("fill", "450101")
  .attr("transform", "translate(295, 10)");

elevationProfile.append("circle")
    .attr("cx", projection([stageIVData[stageIVData.length - 1].position_long, stageIVData[stageIVData.length - 1].position_lat])[0])
    .attr("cy", projection([stageIVData[stageIVData.length - 1].position_long, stageIVData[stageIVData.length - 1].position_lat])[1])
    .attr("r", .65)
    .attr("fill", "450101")
  .attr("transform", "translate(295, 10)");


const stageVData = data.filter(function(d) {
    return d.position_lat < 50 && d.position_long <= 19 && d.position_long > 0 && (d3.timeFormat("%d")(d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.timestamp_adjusted))) == 20;
});

const linePathStageV = elevationProfile.append("path")
    .datum(stageVData)
    .attr("d", line)
    .attr("stroke", "#450101")
    .attr("stroke-width", 0.5)
    .attr("fill", "none")
    .attr('class', 'line')
    .attr("transform", "translate(355, 8)");

// Append circles at the end points
elevationProfile.append("circle")
    .attr("cx", projection([stageVData[0].position_long, stageVData[0].position_lat])[0])
    .attr("cy", projection([stageVData[0].position_long, stageVData[0].position_lat])[1])
    .attr("r", .6)
    .attr("fill", "450101")
    .attr("transform", "translate(355, 8)");

elevationProfile.append("circle")
    .attr("cx", projection([stageVData[stageVData.length - 1].position_long, stageVData[stageVData.length - 1].position_lat])[0])
    .attr("cy", projection([stageVData[stageVData.length - 1].position_long, stageVData[stageVData.length - 1].position_lat])[1])
    .attr("r", .6)
    .attr("fill", "450101")
    .attr("transform", "translate(355, 8)");





//////////////////////////////
///////CLIMB ANNOTATIONS///////
/////////////////////////////

const climbs = elevationProfile.selectAll('.pathClimb')
  .data(data.filter(d => d.climbName !== ""))
  .enter()
  .append('path')
  .attr('class', 'pathClimb')
  .attr('d', d => {
    const x = xScale(d.final_distance / 1000);
    const y = yScale(d.enhanced_altitude);
    const gap = 1; // Adjust the gap length as needed
    return `M${x},${y}L${x},${y + gap}`;
  })
  .attr('stroke', '#5D0100')
  .attr('stroke-width', 0.2)
  .attr('opacity', 0.1) //Does this even work?
  .attr('fill', 'none');    

//CLIMB TEXT

function createClimbText(climbName) {
  const climbData = data.filter(d => d.climbName === climbName);
  const meanDistance = d3.mean(climbData, d => d.final_distance / 1000);
  const maxDistance = d3.max(climbData, d => d.final_distance / 1000);
  const altitudes = climbData.map(d => parseFloat(d.enhanced_altitude));
  const maxAltitude = d3.max(altitudes);

  console.log(`Climb Name: ${climbName}`);
  console.log(`Max Altitude: ${maxAltitude}`);



elevationProfile.append('text')
    .attr("class", "climbText")
    .text(`${climbName} ${climbData[0].climbGradient}%.`)
    .attr("x", xScale(meanDistance - 28))
    .attr("y", climbName === "Gara Lagio" ? yScale(maxAltitude*1.05) : yScale(maxAltitude * 1.25))
    .attr("fill", "#5D0100")
    .attr("dy", 0)
    .attr("dx", 0);

elevationProfile.append('line')
    .attr('class', "Line")
    .attr('x1', xScale(maxDistance))
    .attr('x2', xScale(maxDistance))
    .attr('y1', climbName === "Gara Lagio" ? yScale((maxAltitude*1.05)-20) : yScale((maxAltitude * 1.25)-20))
    .attr('y2', yScale(maxAltitude-40))
    .style("stroke-width", 0.2)
    .style('stroke', '#6C3341')
    .style("stroke-dasharray", "2,2");
}

createClimbText("Civigio");
createClimbText("Madonne Del Ghisallo");
createClimbText("Alpe Teglio");
createClimbText("Mortirolo");
createClimbText("Berninapas");
createClimbText("Ofenpas");
createClimbText("Passo di San Lugano");
createClimbText("Passo Fadaia");
createClimbText("Passo Giau");
createClimbText("Passo Tre Croxi");
createClimbText("Gara Lagio");
createClimbText("Zoncolan");







///////////////////////
///////OUTLIERS///////
//////////////////////

const maxSpeed = d3.max(data, d => Number(d.enhanced_speed)); 
const maxHeartRate = d3.max(data.filter(d => Number(d.heart_rate) <= 200), d => Number(d.heart_rate))
const maxPower = d3.max(data.filter(d => Number(d.power) <= 1900), d => Number(d.power)) //Check if values are okay
const maxElevation = d3.max(data, d => Number(d.enhanced_altitude)); 

//OUTLIERS
console.log(maxHeartRate, maxSpeed, maxPower, maxElevation);

const speedCircle = elevationProfile.append('circle')
  .data(data.filter(function(d) {return d.enhanced_speed == maxSpeed; }))
  .attr("class", "circlePower")
  .attr("cx", function (d) {return xScale(d.final_distance/1000)})
  .attr("cy", function (d) {return yScaleStacked(d.enhanced_speed)})
  .attr("r", 1.5)
  .style("stroke", "#5D0100")
  .style("fill", "#EFDCD3")
  .enter();

const speedText = elevationProfile.append('text')
  .data(data.filter(function(d) {return d.enhanced_speed == maxSpeed; }))
  .attr("class", "maxSpeed")
  .text(function(d) {return "Max " + d3.format(",.1f")(maxSpeed) + "kmH"})
  .attr("x", function (d) {return xScale((d.final_distance/1000)-28)})
  .attr("y", function (d) {return yScaleStacked(d.enhanced_speed)})
  .attr("fill", "#5D0100")
  .attr("dy", 10)
  .attr("dx", 0)
  .enter()


  const heartRateCircle = elevationProfile.append('circle')
    .data(data.filter(function(d) {return d.heart_rate == maxHeartRate; }))
    .attr("class", "circleHeartRate")
    .attr("cx", function (d) {return xScale(d.final_distance/1000)})
    .attr("cy", function (d) {return yScaleStacked(d.heart_rate)})
    .attr("r", 1.5)
    .style("stroke", "#5D0100")
    .style("fill", "#EFDCD3")
    .enter();

  const heartRateText = elevationProfile.append('text')
    .data(data.filter(function(d) {return d.heart_rate == maxHeartRate; }))
    .attr("class", "maxHeartRate")
    .text(function(d) {return "Max " + d3.format(",.0f")(maxHeartRate) + "bpm"})
    .attr("x", function (d) {return xScale((d.final_distance/1000)-28)})
    .attr("y", function (d) {return yScaleStacked((d.heart_rate))})
    .attr("fill", "#5D0100")
    .attr("dy", 10)
    .attr("dx", 0)
    .enter()

const powerCircle = elevationProfile.append('circle')
  .data(data.filter(function(d) {return d.power == maxPower; }))
  .attr("class", "circlePower")
  .attr("cx", function (d) {return xScale(d.final_distance/1000)})
  .attr("cy", function (d) {return yScaleStacked(d.power)})
  .attr("r", 1.5)
  .style("stroke", "#5D0100")
  .style("fill", "#EFDCD3")
  .enter();

  const powerText = elevationProfile.append('text')
  .data(data.filter(function(d) {return d.power == maxPower; }))
    .attr("class", "maxPower")
    .text(function(d) {return "Max " + d3.format(",.0f")(maxPower) + "W"})
    .attr("x", function (d) {return xScale((d.final_distance/1000)-28)})
    .attr("y", function (d) {return yScaleStacked(d.power)})
    .attr("fill", "#5D0100")
    .attr("dy", 10)
    .attr("dx", 0)
    .enter()

const elevationCircle = elevationProfile.append('circle')
  .data(data.filter(function(d) {return d.enhanced_altitude == maxElevation; }))
  .attr("class", "circlePower")
  .attr("cx", function (d) {return xScale(d.final_distance/1000)})
  .attr("cy", function (d) {return yScale(d.enhanced_altitude)})
  .attr("r", 1.5)
  .style("stroke", "#5D0100")
  .style("fill", "#EFDCD3")
  .enter();

  const elevationText = elevationProfile.append('text')
  .data(data.filter(function(d) {return d.enhanced_altitude == maxElevation; }))
    .attr("class", "maxPower")
    .text(function(d) {return "Max " + d3.format(",.0f")(maxElevation) + "hm"})
    .attr("x", function (d) {return xScale((d.final_distance/1000)-28)})
    .attr("y", function (d) {return yScale((d.enhanced_altitude))})
    .attr("fill", "#5D0100")
    .attr("dy", +2)
    .attr("dx", +22)
    .enter()



//////////////////////////////////////
/////ROUTE VISUALIZATION TOTALS///////
/////////////////////////////////////
const elevationProfileII = d3.select("#elevationProfileII")
  .attr('width', 100 + 'px')
  .attr('height', 30 + 'px')
  .append("g");

// ROUTE VIZ
const projectionI = d3.geoIdentity()
  .reflectY(true)
  .translate([-130, 710])
  .scale([15]);

const filteredData = data.filter(function (d) {
  return d.position_lat < 50 && d.position_long <= 19 && d.position_long > 0;
});

const lineRoute = d3.line()
  .x(function (d) { return projectionI([d.position_long, d.position_lat])[0]; })
  .y(function (d) { return projectionI([d.position_long, d.position_lat])[1]; })
  .curve(d3.curveBasis);

const linePath = elevationProfileII.append("path")
  .datum(filteredData)
  .attr("d", lineRoute)
  .attr("stroke", "#450101")
  .attr("stroke-width", 0.8)
  .attr("fill", "none")
  .attr('class', 'line');

elevationProfileII.append("circle")
  .attr("cx", projectionI([filteredData[0].position_long, filteredData[0].position_lat])[0])
  .attr("cy", projectionI([filteredData[0].position_long, filteredData[0].position_lat])[1])
  .attr("r", 1.4)
  .attr("fill", "#450101");

elevationProfileII.append("circle")
  .attr("cx", projectionI([filteredData[filteredData.length - 1].position_long, filteredData[filteredData.length - 1].position_lat])[0])
  .attr("cy", projectionI([filteredData[filteredData.length - 1].position_long, filteredData[filteredData.length - 1].position_lat])[1])
  .attr("r", 1.4)
  .attr("fill", "#450101");


});