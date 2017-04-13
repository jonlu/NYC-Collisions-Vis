document.addEventListener("DOMContentLoaded", function(event) {
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")
    .style("opacity", 0);

  var parseDate = d3.timeParse("%m/%d/%Y");
  var parseTime = d3.timeParse("%H:%M");

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

  function drawGraph() {
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

      filterMap(filterSet.values());

      var entries = data.filter((d) => { return filterSet.has(d.car1) && filterSet.has(d.car2); });
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
            .style("top", (d3.event.pageY - 15) + "px");
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
          var l = colorMap.get(totals2[i].key);
          var c = d3.hsl("#706D97");
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

});
