String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) {
    return a.toUpperCase();
  });
};
var idIncrementer = 0;
document.addEventListener('DOMContentLoaded', function(event) {
  // horizontal scrolling
  (function($) {
      $.jInvertScroll(['.scroll']);
  }(jQuery));

  /************ MAP *************/
  mapboxgl.accessToken = 'pk.eyJ1Ijoiam9ubHUiLCJhIjoiY2l5bWdmYjlxMDAwZjQ0czdtYmNwYXQwNyJ9.PXRqPMmzNofQx4FYKMmJ_A';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
    center: [-73.797834, 40.69000624],
    minZoom: 8.5,
    maxZoom: 16,
    zoom: 9.4,
    attributionControl: false,
    scrollZoom: false
  });

  map.boxZoom.disable();

  var nav = new mapboxgl.NavigationControl();
  map.addControl(nav, 'top-left');
  map.addControl(new mapboxgl.AttributionControl({
    compact: true
  }));

  map.on('style.load', function() {
    d3.json('csv/data.geojson', function(error, data) { //http://localhost:80
      if (error) return console.error(error);


      var canvas = map.getCanvasContainer();
      var start;    //starting point
      var bstart;   //starting lngLat
      var current;  //current point
      var bcurrent; //current lnglat
      var box; //initial bounding box

      map.addSource("accidents", {
        "type": "geojson",
        "data": data
      });
      map.addLayer({
        'id': 'crashes',
        'source': 'accidents',
        'type': 'circle',
        'paint': {
          'circle-radius': {
            'base': 3,
            'stops': [
              [8.5, 3],
              [12, 10],
              [16, 40],
            ]
          },
          'circle-color': {
            property: 'CASUALTIES',
            stops: [
              [0, 'rgba(255, 255, 0, .015)'],
              [5, 'rgba(255, 0, 0, .06)']
            ]

          },
        }

      });
      canvas.addEventListener('mousedown', md, true);

      //clears the previous bounding polygon on click
      map.on("click", function() {
        if(map.getLayer("box" + idIncrementer) != undefined) {
          map.removeLayer("box" + idIncrementer)
          idIncrementer++;

          drawGraph();
          drawAnthony();
        }
      })

      //secondary mousedown event listener
      function md(e) {
        if (!(e.shiftKey && e.button === 0)) return;
        map.dragPan.disable();
        if(map.getLayer("box" + idIncrementer) != undefined) {
          map.removeLayer("box" + idIncrementer)
          idIncrementer++;
        }
        map.once("mousedown", mouseDown, true);
      }

      //actual mousedown event
      function mouseDown(e) {
        map.on('mousemove', onMouseMove);
        map.on('mouseup', onMouseUp);
        // Capture the first xy coordinates
        start = e.point;
        bstart = e.lngLat;
      }

      function onMouseMove(e) {
        // Capture the ongoing xy coordinates
        current = e.point;
        bcurrent = e.lngLat;

        // Append the box element if it doesnt exist
        if (!box) {
            box = document.createElement('div');
            box.classList.add('boxdraw');
            canvas.appendChild(box);
        }

        var minX = Math.min(start.x, current.x),
            maxX = Math.max(start.x, current.x),
            minY = Math.min(start.y, current.y),
            maxY = Math.max(start.y, current.y);

        // Adjust width and xy position of the box element ongoing
        var pos = 'translate(' + minX + 'px,' + minY + 'px)';
        box.style.transform = pos;
        box.style.WebkitTransform = pos;
        box.style.width = maxX - minX + 'px';
        box.style.height = maxY - minY + 'px';
      }

      function onMouseUp(e) {
        // Capture xy coordinates
        finish([start, e.point],[bstart, e.lngLat]);
      }

      function finish(bbox, polygon) {

        //stop event listener
        map.dragPan.enable();
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);

        if (box) { //remove temporary bounding box
            box.parentNode.removeChild(box);
            box = null;
        }

          // If bbox exists. use this value as the argument for `queryRenderedFeatures`
        if (bbox && polygon) {
          map.addLayer({
            'id': 'box' + idIncrementer,
            'type': 'fill',
            'source': {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'geometry': {
                  'type': 'Polygon',
                  'coordinates': [[[Math.min(polygon[0].lng, polygon[1].lng),Math.max(polygon[0].lat, polygon[1].lat)],
                    [Math.max(polygon[0].lng, polygon[1].lng),Math.max(polygon[0].lat, polygon[1].lat)],
                    [Math.max(polygon[0].lng, polygon[1].lng),Math.min(polygon[0].lat, polygon[1].lat)],
                    [Math.min(polygon[0].lng, polygon[1].lng),Math.min(polygon[0].lat, polygon[1].lat)]]]
                }
              }
            },
            'paint': {
                'fill-color': 'rgba(56,135,190,0.2)',
                'fill-outline-color': 'rgba(56,135,190,1)',
            }
          });

          // var features = map.queryRenderedFeatures(bbox, { layers: ['crashes'] });
          // var filterSet = [];
          // features.forEach(function (key){
          //   filterSet.push(key.properties["UNIQUE KEY"])
          // });
          // var filterSet = d3.set();
          // features.forEach(function (key){
          //   filterSet.add(key.properties["UNIQUE KEY"])
          // });
          drawGraph([[Math.min(polygon[0].lng, polygon[1].lng),Math.max(polygon[0].lat, polygon[1].lat)],[Math.max(polygon[0].lng, polygon[1].lng),Math.min(polygon[0].lat, polygon[1].lat)]]);
          drawAnthony([[Math.min(polygon[0].lng, polygon[1].lng),Math.max(polygon[0].lat, polygon[1].lat)],[Math.max(polygon[0].lng, polygon[1].lng),Math.min(polygon[0].lat, polygon[1].lat)]]);
          // console.log(features); pass features as data
        } //if bbox && polygon
      } // finish()
    }); // map.on load
  }); //d3.json(data)

  function filterMap(vehicles) {
    var filter = vehicles.reduce(function(memo, type) {
                memo.push(type);
                return memo;
    }, ['in', 'VEHICLE TYPE CODE 1']);
    map.setFilter("crashes", filter);
  } //filterMap()

// BEGIN SCHUYLER'S CODE

  var needhelp = d3.select("#needhelp");

  needhelp.on("mouseover", function (d, i) {
    div.transition()
      .duration(200)
      .style("opacity", .9);
    div.html("Bar length represents involvement percentage. </br> Edge weight represents frequency.")
      .style("left", (d3.event.pageX - 100) + "px")
      .style("top", (d3.event.pageY - 20) + "px");
  })
  .on("mouseout", function (d) {
    div.transition()
      .duration(500)
      .style("opacity", 0);
  })
  .on("mousemove", () => {
    div.style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 15) + "px")
      .style("opacity", .9);
  })


  var div = d3.select("body").append("div")
    .attr("class", "tooltip scroll")
    .attr("id", "tooltip")
    .style("opacity", 0);

  $(window).scroll(() => {
    div.style("opacity", 0);
  })

  var parseDate = d3.timeParse("%m/%d/%Y");

  var strokeWidthScale = d3.scaleLinear()
    .domain([1, 29927])
    .range([3, 50]);

  var opacityScale = d3.scaleLinear()
    .domain([1, 29927])
    .range([.2, .5]);

  var margin = { top: 20, right: 20, bottom: 20, left: 20 },
    width = 275 - margin.left - margin.right,
    height = 650 - margin.top - margin.bottom;

  var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  function drawGraph(filterArray) {
    d3.csv("csv/gData.csv", type, function (error, data) {
      if (error) throw error;

      var filterSet = d3.set();

      chart.selectAll("line")
        .remove();
      /*
      chart.selectAll("rect")
        //.transition()
        //.duration(500)
        .remove();
  */
      if (d3.select("#scooter").property("checked")) {
        filterSet.add('SCOOTER');
      }
      if (d3.select("#pasVe").property("checked")) {
        filterSet.add('PASSENGER VEHICLE');
      }
      if (d3.select("#suv").property("checked")) {
        filterSet.add('SPORT UTILITY / STATION WAGON');
      }
      if (d3.select("#taxi").property("checked")) {
        filterSet.add('TAXI');
      }
      if (d3.select("#van").property("checked")) {
        filterSet.add('VAN');
      }
      if (d3.select("#other").property("checked")) {
        filterSet.add('OTHER');
      }
      if (d3.select("#unkn").property("checked")) {
        filterSet.add('UNKNOWN');
      }
      if (d3.select("#sComVe").property("checked")) {
        filterSet.add('SMALL COM VEH(4 TIRES)');
      }
      if (d3.select("#pickUp").property("checked")) {
        filterSet.add('PICK-UP TRUCK');
      }
      if (d3.select("#lComCe").property("checked")) {
        filterSet.add('LARGE COM VEH(6 OR MORE TIRES)');
      }
      if (d3.select("#bus").property("checked")) {
        filterSet.add('BUS');
      }
      if (d3.select("#livery").property("checked")) {
        filterSet.add('LIVERY VEHICLE');
      }
      if (d3.select("#moto").property("checked")) {
        filterSet.add('MOTORCYCLE');
      }
      if (d3.select("#ambulance").property("checked")) {
        filterSet.add('AMBULANCE');
      }
      if (d3.select("#bike").property("checked")) {
        filterSet.add('BICYCLE');
      }
      if (d3.select("#fireTruck").property("checked")) {
        filterSet.add('FIRE TRUCK');
      }
      if (d3.select("#pedicab").property("checked")) {
        filterSet.add('PEDICAB');
      }

      var entries = data.filter((d) => {
        var jonFilter = true;
        if (filterArray !== undefined) {
          //jonFilter = filterArray.includes(d.uid);
          if (d.lon > filterArray[0][0] && d.lat < filterArray[0][1]
              && d.lon < filterArray[1][0] && d.lat > filterArray[1][1]) {
              jonFilter = true;
            }
          else {
            jonFilter = false;
          }
        }
        return filterSet.has(d.car1) && filterSet.has(d.car2) && jonFilter;
      });
      entries = d3.nest()
        .key((d) => { return d.car1; })
        .key((d) => { return d.car2; })
        .rollup((leaves) => { return leaves.length; })
        .entries(entries);

      entries.sort((a, b) => {
        var tot1 = 0;
        for (var i = 0; i < a.values.length; i++) {
          tot1 += a.values[i].value;
        }
        var tot2 = 0;
        for (var i = 0; i < b.values.length; i++) {
          tot2 += b.values[i].value;
        }

        return tot2 - tot1;
      });

      var totals1 = d3.nest()
        .key((d) => { return d.car1 })
        .rollup((leaves) => { return leaves.length; })
        .entries(data);

      totals1.sort((a, b) => {
        return b.value - a.value;
      })
      totals1 = totals1.filter((d) => { return filterSet.has(d.key); });

      var totals2 = d3.nest()
        .key((d) => { return d.car2 })
        .rollup((leaves) => { return leaves.length; })
        .sortValues((a, b) => { return b - a })
        .entries(data);
      totals2.sort((a, b) => {
        return b.value - a.value;
      })
      totals2 = totals2.filter((d) => { return filterSet.has(d.key); });
      var numberAccidents = 0; // / numberAccidents * heigh = height of the bar
      for (var i = 0; i < totals1.length; i++) {
        numberAccidents += totals1[i].value;
      }

      var numberAccidents2 = 0;
      for (var i = 0; i < totals2.length; i++) {
        numberAccidents2 += totals2[i].value;
      }

      var heights = []
      for (var i = 0; i < entries.length; i++) {
        heights[i] = totals1[i].value / numberAccidents * (height);
      }

      var positions = [];
      positions[0] = 0;
      for (var i = 1; i < entries.length; i++) {
        positions[i] = ((totals1[i - 1].value / numberAccidents * (height)) + positions[i - 1]);
      }

      var heights2 = []
      for (var i = 0; i < totals2.length; i++) {
        heights2[i] = totals2[i].value / numberAccidents2 * height;
      }
      var positions2 = [];
      positions2[0] = 0;
      for (var i = 1; i < totals2.length; i++) {
        positions2[i] = ((totals2[i - 1].value / numberAccidents2 * (height)) + positions2[i - 1]);
      }

      var color = d3.hsl("#706D97");
      var cScale = d3.scaleLinear()
        .domain([0, entries.length - 1])
        .range([.2, .8]);

      var colorMap = d3.map();

      var rects1 = chart.selectAll("rect.car1")
        .data(totals1, (d) => { return d.key });

      rects1.exit()
        .transition()
        .duration(1000)
        .attr("opacity", 0)
        .remove();

      rects1.enter()
        .append("rect")
        .merge(rects1).attr("x", (d, i) => { return 0; })
        .attr("width", 40)
        .attr("class", "car1")
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("fill", (d, i) => {
          color.l = cScale(i);
          colorMap.set(totals1[i].key, color.l);
          return color;
        })
        .on("mouseover", function (d, i) {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html(d.key)
            .style("left", (d3.event.pageX - 100) + "px")
            .style("top", (d3.event.pageY - 20) + "px");
        })
        .on("mouseout", function (d) {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        })
        .on("mousemove", () => {
          div.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 15) + "px")
            .style("opacity", .9);
        })
        .transition()
        .duration(1000)
        .attr("height", (d, i) => { return heights[i]; })
        .attr("y", (d, i) => { return positions[i]; });



      var rects2 = chart.selectAll("rect.car2")
        .data(totals2, (d) => { return d.key });
      rects2.exit()
        .remove();
      rects2.enter()
        .append("rect")
        .merge(rects2)
        .attr("x", width - 40)
        .attr("width", 40)
        .attr("class", "car2")
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("fill", (d, i) => {
          var l;
          if (colorMap.has(totals2[i].key)) {
          l = colorMap.get(totals2[i].key);
        }
        else {
          l = .5;
        }
          var c = d3.hsl("#706D97");
          l = Math.min(.85, l);
          c.l = l;
          return c;

        })
        .on("mouseover", function (d, i) {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html(d.key)
            .style("left", (d3.event.pageX - 100) + "px")
            .style("top", (d3.event.pageY - 20) + "px");
        })
        .on("mouseout", function (d) {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        })
        .on("mousemove", () => {
          div.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 15) + "px");
        })
        .transition()
        .duration(1000)
        .attr("height", (d, i) => {
          return heights2[i];
        })
        .attr("y", (d, i) => { return positions2[i]; });

      var max = 0;
      var min = 999999;
      for (var i = 0; i < entries.length; i++) {
        for (var j = 0; j < entries[i].values.length; j++) {
          var entry = entries[i].values[j].value;
          if (entry > max)
            max = entry;
          if (entry < min)
            min = entry;
        }
      }

      // draw the lines
      strokeWidthScale.domain([min, max]);
      opacityScale.domain([min, max]);

      for (var i = 0; i < entries.length; i++) {
        for (var j = 0; j < entries[i].values.length; j++) {
          //entries[i].values[j]
          var car2Index;
          for (car2Index = 0; car2Index < totals2.length; car2Index++) {
            if (totals2[car2Index].key === entries[i].values[j].key)
              break;
          } // end index finding for
          var value = entries[i].values[j].value;
          chart.append("line")
            .attr('x1', 20)
            .attr('y1', positions[i] + heights[i] / 2)
            .attr('x2', 20)
            .attr('y2', positions[i] + heights[i] / 2)
            .attr("stroke-width", strokeWidthScale(value))
            .style("stroke", "#BFBCCB")
            .attr("opacity", opacityScale(value))
            .attr("stroke-linecap", "round")
            .attr("class", "graphEdge")
            .transition()
            .duration(700)
            .delay(300)
            .attr('x2', width - 20)
            .attr('y2', (positions2[car2Index] + heights2[car2Index] / 2));

        }
      }
      //filterMap(filterSet.values());
      //drawAnthony(filterSet.values());

    });

  }

  function type(d) {
    //d.date = parseDate(d['DATE']);
    //d.time = parseTime(d['TIME']);
    //d.borough = d['BOROUGH'];
    d.lon = d['LONGITUDE'];
    d.lat = d['LATITUDE'];
    //d.factor = d['CONTRIBUTING FACTOR VEHICLE 1'];
    d.car1 = d['VEHICLE TYPE CODE 1'];
    d.car2 = d['VEHICLE TYPE CODE 2'];
    //d.uid = d['UNIQUE KEY']
    return d;
  }

  function hideAll()
  {
    d3.selectAll(".boxes")
      .property("checked", false);

    drawGraph();
  }
  function showAll()
  {
    d3.selectAll(".boxes")
      .property("checked", true);

    drawGraph();
  }

  d3.select("#pasVe").on("change", drawGraph);
  d3.select("#suv").on("change", drawGraph);
  d3.select("#taxi").on("change", drawGraph);
  d3.select("#van").on("change", drawGraph);
  d3.select("#other").on("change", drawGraph);
  d3.select("#unkn").on("change", drawGraph);
  d3.select("#sComVe").on("change", drawGraph);
  d3.select("#pickUp").on("change", drawGraph);
  d3.select("#lComCe").on("change", drawGraph);
  d3.select("#bus").on("change", drawGraph);
  d3.select("#livery").on("change", drawGraph);
  d3.select("#moto").on("change", drawGraph);
  d3.select("#ambulance").on("change", drawGraph);
  d3.select("#bike").on("change", drawGraph);
  d3.select("#fireTruck").on("change", drawGraph);
  d3.select("#scooter").on("change", drawGraph);
  d3.select("#pedicab").on("change", drawGraph);
  d3.select("#hideall").on("click", hideAll);
  d3.select("#showall").on("click", showAll);


  drawGraph();











  //BEGIN ANTHONY
  var w = 940,
      h = 700,
      margarin = { top: 60, right: 10, bottom: 60, left: 90 },
      widthh = w - margarin.left - margarin.right,
      hait = h - margarin.top - margarin.bottom;

  var svg = d3.select("#plot")
      .append("svg")
      .attr("width", w)
      .attr("height", h);

  var x = d3.scaleTime().range([0, widthh]),
      y = d3.scaleLinear().range([hait, 0]),
      r = d3.scaleLinear().range([2, 12]);

  var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%H:%M")).ticks(24),
      yAxis = d3.axisLeft(y);

  var parseTime = d3.timeParse("%H:%M");

  var focus = svg.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margarin.left + "," + margarin.top + ")");

  focus.append("g")
      .attr("class", "axis--x")
      .attr("transform", "translate(0," + hait + ")")
      .call(xAxis);
      focus.append("text")
          .attr("y", hait - 20)
          .attr("x", widthh - 40)
          .style("font-size", "14px")
          .attr("dy", "16px")
          // .attr("text-anchor", "end")
          .style("font-family", "Raleway")
          .text("Time");

  focus.append("g")
      .attr("class", "axis--y")
      // .attr("transform", "translate("+ margarin.left+", 0)")
      .call(yAxis);
  focus.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .style("font-family", "Raleway")
    .text("Accidents");

  function drawAnthony(filterArray)
  {
  d3.csv("csv/outputForAnthony.csv", function (data) {
      data.forEach(function (d) {
          var time = parseTime(d['TIME']); // in type function
          time.setMinutes((Math.round(time.getMinutes() / 15) * 15) % 60); // do with minutes
          d.time = time;

          //d.casualties = d['CASUALTIES'];
      });

      data = data.filter((d) => {

        var jonFilter = true;
        if (filterArray !== undefined) {
          //jonFilter = filterArray.includes(d.uid);
          if (d['LONGITUDE'] > filterArray[0][0] && d['LATITUDE'] < filterArray[0][1]
              && d['LONGITUDE'] < filterArray[1][0] && d['LATITUDE'] > filterArray[1][1]) {
              jonFilter = true;
            }
          else {
            jonFilter = false;
          }
        }
        return jonFilter;
      });

      console.log()


      var entries = d3.nest().key(function (d) {
          return d.time;
      }).rollup(function (leaves) {
          return {
              "frequency": leaves.length,
              "personsInjured": d3.sum(leaves, function (d) {
                  return d['NUMBER OF PERSONS INJURED'];
              }), "personsKilled": d3.sum(leaves, function (d) {
                  return d['NUMBER OF PERSONS KILLED'];
              }), "pedsInjured": d3.sum(leaves, function (d) {
                  return d['NUMBER OF PEDESTRIANS INJURED'];
              }), "pedsKilled": d3.sum(leaves, function (d) {
                  return d['NUMBER OF PEDESTRIANS KILLED'];
              }), "cycsInjured": d3.sum(leaves, function (d) {
                  return d['NUMBER OF CYCLIST INJURED'];
              }), "cycsKilled": d3.sum(leaves, function (d) {
                  return d['NUMBER OF CYCLIST KILLED'];
              }), "motoristInjured": d3.sum(leaves, function (d) {
                  return d['NUMBER OF MOTORIST INJURED'];
              }), "motoristKilled": d3.sum(leaves, function (d) {
                  return d['NUMBER OF MOTORIST KILLED'];
              }), "casualties": d3.sum(leaves, function (d) {
                  return d['CASAULTIES'];
              })
          };
      }).entries(data);
      /*var max_r = d3.max(punchcard_data.map(
                         function (d) { return d[2]; })),
              .domain([0, d3.max(punchcard_data, function (d) { return d[2]; })])
              .range([0, 12]);*/

      x.domain(d3.extent(entries, function (d) { return new Date(d.key); }));
      y.domain(d3.extent(entries, function (d) { return d.value.frequency; }));
      r.domain(d3.extent(entries, function (d) { return d.value.casualties; }));

      // var acolor = d3.hsl("red");
      // var acScale = d3.scaleLinear()
      //     .domain(d3.extent(entries, function (d) { return d.value.casualties; }))
      //     .range([.8, .2]);

      var acolor = d3.hsl("red");
      var bcolor = d3.hsl("yellow");
      var hscale = d3.scaleLinear()
          .range([bcolor.h, acolor.h])
          .domain(d3.extent(entries, function (d) { return d.value.casualties; }));
      var lscale = d3.scaleLinear()
          .range([bcolor.l, acolor.l])
          .domain(d3.extent(entries, function (d) { return d.value.casualties; }));


      focus.selectAll(".axis--x").call(xAxis)
      focus.selectAll(".axis--y").transition().duration(300).call(yAxis)



      var circs = focus.selectAll("circle")
          .data(entries);

          circs.exit()
            .transition()
            .duration(1000)
            .attr("opacity", 0)
            .remove();

          circs.enter()
          .append("circle")
          .merge(circs)
          .attr("class", "circle")
          .attr("fill", (d) => {
              // acolor.l = acScale(d.value.casualties);
              // return acolor;
              acolor.l = lscale(d.value.casualties);
              acolor.h = hscale(d.value.casualties);
              return acolor;
          })
          .on("mouseover", (d) => {
              focus.transition()
                  .duration(1000)
                  .attr("opacity", .2);
              barChart(d);
          })
          .on("mouseout", (d) => {
              focus.transition().duration(1000).attr("opacity", 1);
              d3.selectAll(".TRASH").transition().duration(500).attr("opacity", 0).remove();
          })
          .transition()
          .duration(700)
          .delay(200)
          .attr("cx", function (d) { return x(new Date(d.key)); })
          .attr("cy", function (d) { return y(d.value.frequency); })
          .attr("r", function (d) { return r(d.value.casualties); });
  });
}
  function barChart(data) {
      d3.select(".trash").remove();

      var svgWidth = 600,
          svgHeight = 580;

      var margin = { top: 80, right: 20, bottom: 200, left: 170 },
          width = +svgWidth - margin.left - margin.right,
          height = +svgHeight - margin.top - margin.bottom;

      var _svg = svg.append("svg")
          .attr("opacity", 0)
          .attr("width", svgWidth)
          .attr("height", svgHeight)
          .attr("class", "TRASH")
          .attr("transform", "translate(" + width / 2 + "," + margin.top + ")")

      var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
          y = d3.scaleLinear().rangeRound([height, 0]);

      var g = _svg.append("g")
          .attr("class", "trash")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var domainStuff = ['NUMBER OF PERSONS INJURED',
          'NUMBER OF PERSONS KILLED',
          'NUMBER OF PEDESTRIANS INJURED',
          'NUMBER OF PEDESTRIANS KILLED',
          'NUMBER OF CYCLIST INJURED',
          'NUMBER OF CYCLIST KILLED',
          'NUMBER OF MOTORIST INJURED',
          'NUMBER OF MOTORIST KILLED'];
      x.domain(domainStuff);

      var fake = [
          data.value['personsInjured'],
          data.value['personsKilled'],
          data.value['pedsInjured'],
          data.value['pedsKilled'],
          data.value['cycsInjured'],
          data.value['cycsKilled'],
          data.value['motoristInjured'],
          data.value['motoristKilled']
      ];
      //var fake = d3.values(data.value);
      y.domain([0, d3.max(fake)]);

      g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("transform", "rotate(-45)")


      g.append("g")
          .attr("class", "axis axis--y")
          .call(d3.axisLeft(y).ticks(10))
          .append("text")
          .style("text-anchor", "end")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .text("Frequency");

      for (var i = 0; i < 8; i++) {
          var value = fake[i];
          g.append("rect")
              .attr("class", "bar")
              .attr("x", x(domainStuff[i]))
              .attr("y", function (d) { return y(value); })
              .attr("width", x.bandwidth())
              .attr("height", function (d) { return height - y(value); })
              .style("pointer-events", "none");
      }

      _svg.transition()
          .delay(200)
          .duration(300)
          .attr("opacity", 1);
  }

  drawAnthony();


});
