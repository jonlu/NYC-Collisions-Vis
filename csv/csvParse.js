var csv = require('fast-csv');
var fs = require('fs');

csv
  .fromPath("forLu.csv", { headers: true })
  .transform(function(d) {
    if (d.LONGITUDE) {
      return {
        lon: d.LONGITUDE,
        lat: d.LATITUDE,
        'UNIQUE KEY': d["UNIQUE KEY"],
        'VEHICLE TYPE CODE 1': d["VEHICLE TYPE CODE 1"],
        'CASUALTIES': d.CASUALTIES
      }
    }


  })
  .pipe(csv.createWriteStream({ headers: true }))
  .pipe(fs.createWriteStream("data.csv", { encoding: "utf8" }));
