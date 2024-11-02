


const app = d3
  .select("#app")
  .html("")
  .style("position", "fixed")
  .style("inset", "0")
  .style("padding", "0")
  .style("overflow", "hidden");

const mapElement = app
  .append("div")
  .attr("id", "map")
  .style("position", "absolute")
  .style("top", "0")
  .style("left", "0")
  .style("right", "0")
  .style("bottom", "0")
  .style("width", "100%")
  .style("height", "100%");

  // Loading screen --------------------------------------------
  const loadingScreen = d3
    .select('body')
    .append('div')
    .attr('class', 'loading-screen')
    .style('position', 'fixed')
    .style('top', 0)
    .style('left', 0)
    .style('width', '100%')
    .style('height', '100%')
    .style('background', '#373737')
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('align-items', 'center')
    .style('z-index', 1000);

  // Add text clipping mask and loading wave animation
  const waveText = loadingScreen
    .append('div')
    .style('color', 'white')
    .style('font-size', '18px')
    .style('font-family', "'Open Sans', sans-serif")
    .style('font-weight', 'regular')
    .style('position', 'relative')
    .style('overflow', 'hidden')
    .style('width', '200px')
    .style('height', '50px')
    .style('text-align', 'center')
    .style('line-height', '50px')
    .style('padding', '10px')
    .text('Clustering Quakes');

  const wave = waveText
    .append('div')
    .style('position', 'absolute')
    .style('top', '0')
    .style('left', '-200px')
    .style('width', '200px')
    .style('height', '6px')
    .style(
      'background',
      'linear-gradient(to right, #ff7900 0%, rgba(255, 255, 255, 0.0) 70%, #ff4500 100%)'
    )
    .style('border-radius', '10px') // Add rounded edges
    .style('animation', 'wave 2s infinite');

  d3.select('head').append('style').text(`
    @keyframes wave {
      0% { left: -200px; }
      50% { left: 100px; }
      100% { left: -200px; }
    }
  `);

  // Remove loading screen after data is loaded
  d3.json("data/worldQuakesMiles.json").then((data) => {
    console.log(data);
    loadingScreen.transition().duration(3000).style('opacity', 0).remove();
  });

  
// create leaflet map + home view
const map = L.map(mapElement.node(), { zoomControl: false }).setView([2.5, 118.0], 4);
const home = [2.5, 118.0];

// Tile Layer
const tileLayer = L.tileLayer("https://tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token={accessToken}", {
  minZoom: 2.5,
  maxZoom: 22,
  attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps<a/>',
  accessToken: '0XIwJCK3vkKyeaK2AJ93EcmGVY66M1EidVdHdLtdFO7N4ebcYje1xq0RFTxNHrIk'
}).addTo(map);



// // scale bar
// L.control.scale({ 
//   position: "bottomleft", 
//   imperial: true 
// }).addTo(map);

// d3.select(".leaflet-control-scale")
//   .style("font-family", "Open Sans, sans-serif")
//   .style("font-weight", "bold");


// home button
L.Control.ResetButton = L.Control.extend({
  options: {
    position: "topright",
  },
  onAdd: function (map) {
    const container = d3
      .create("div")
      .attr("class", "leaflet-bar leaflet-control");

    const button = container
      .append("a")
      .attr("class", "leaflet-control-button")
      .attr("role", "button")
      .style("cursor", "pointer")
      .style("background", "rgba(255, 121, 0, 0.2)")
      .style("border", "1px solid #ff7900");

    const icon = button
      .append("svg")
      .attr("viewBox", "0 0 550 550")
      .style("width", "17px")
      .style("height", "17px")
      .style("margin-top", "6px")
      .append("path")
      .attr("d", "M540.76,254.788L294.506,38.216c-11.475-10.098-30.064-10.098-41.386,0L6.943,254.788c-11.475,10.098-8.415,18.284,6.885,18.284h75.964v221.773c0,12.087,9.945,22.108,22.108,22.108h92.947V371.067c0-12.087,9.945-22.108,22.109-22.108h93.865c12.239,0,22.108,9.792,22.108,22.108v145.886h92.947c12.24,0,22.108-9.945,22.108-22.108v-221.85h75.965C549.021,272.995,552.081,264.886,540.76,254.788z")
      .attr("fill", "#ff7900");

    button.on("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    map.flyTo(home, 4, {
      animate: true,
      duration: 2
    });
    });

    return container.node();
  },
  onRemove: function (map) {},
});
const resetButton = new L.Control.ResetButton();
resetButton.addTo(map);



//heat map
let heatLayer;

//data import from json
d3.json("data/worldQuakesMiles.json").then((data) => {
  console.log(data);

  const markers = L.markerClusterGroup({
    disableClusteringAtZoom: 8, 
    maxClusterRadius: 50, 
    iconCreateFunction: function (cluster) {
      return L.divIcon({
        html: `<div style="background-color: rgba(255, 121, 0, 0.6); border: 2px solid #ff7900; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-weight: regular; font-size: 10px; font-family: 'Open Sans', sans-serif;">${cluster.getChildCount()}</div>`,
        className: 'marker-cluster',
        iconSize: L.point(30, 30)
      });
    }
  });


  //heatmaps
  heatLayer = L.heatLayer(
    data.features.map((feature) => [
      feature.geometry.coordinates[1],
      feature.geometry.coordinates[0],
      feature.properties.mag,
    ]),
    {
      radius: 10,
      blur: 15,
      maxZoom: 10,
      gradient: {
        0.2: "lightblue",
        0.4: "lightgreen",
        0.6: "yellow",
        0.8: "orange",
        1.0: "red",
      },
    }
  );


  const earthquakes = L.geoJSON(data, {
    pointToLayer: function (feature, latlng) {
      const magnitude = feature.properties.mag;
      return L.circleMarker(latlng, {
        radius: Math.pow(magnitude, 1.2),
        fillColor: "#ff7900",
        color: "#ff7900",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.2,
      });
    },
    onEachFeature: function (feature, layer) {
      layer.bindPopup(`
        <span style="font-family: 'Open Sans'; font-weight: regular; font-size: 10px;">Location
        <br/></span> <span style="font-family: 'Open Sans'; font-weight: bold; font-size: 14px; color: #ff7900;">${feature.properties.place}</span>
        <br/>
        <br/>
        <span style="font-family: 'Open Sans'; font-weight: regular; font-size: 10px;">Magnitude</span>
        <br/>
        <span style="font-family: 'Open Sans'; font-weight: bold; font-size: 14px; color: #ff7900;">${feature.properties.mag}</span>`);
    },
  });

  markers.addLayer(earthquakes);
  map.addLayer(markers);

});

// animate earthquake radius
function smoothAnimateEarthquakeRadius(layer) {
  const originalRadius = layer.getRadius();
  const expandedRadius = originalRadius * 1.5;
  const duration = 1300; // 2 seconds
  const frameRate = 60; // 60 frames per second
  const totalFrames = (duration / 1000) * frameRate;
  let frame = 0;
  let growing = true;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function animate() {
    const progress = frame / totalFrames;
    const easedProgress = easeInOut(progress);
    const newRadius = growing
      ? originalRadius + (expandedRadius - originalRadius) * easedProgress
      : expandedRadius - (expandedRadius - originalRadius) * easedProgress;

    layer.setRadius(newRadius);

    if (frame >= totalFrames) {
      growing = !growing;
      frame = 0;
    } else {
      frame++;
    }

    requestAnimationFrame(animate);
  }

  animate();
}

map.on('layeradd', function (event) {
  if (event.layer instanceof L.CircleMarker) {
    smoothAnimateEarthquakeRadius(event.layer);
  }
});


// Toggle button to show/hide heat map layer
const toggleHeatMapButton = L.control({ position: "topright" });

toggleHeatMapButton.onAdd = function () {
  const div = L.DomUtil.create("div", "info toggle-heatmap-button");
  div.innerHTML = '<button id="toggleHeatMap" style="background: rgba(255, 121, 0, 0.2); border: 1px solid #ff7900; cursor: pointer; border-radius: 2px; padding-top: 5px; margin-left: -2px;"><img src="/images/heatmap.svg" alt="Heat Map" style="width: 18px; height: 19px; filter: invert(38%) sepia(100%) saturate(1000%) hue-rotate(359deg) brightness(100%) contrast(400%);"></button>';
  return div;
};

toggleHeatMapButton.addTo(map);

let heatMapLayerVisible = true;

document.getElementById("toggleHeatMap").addEventListener("click", function () {
  if (heatMapLayerVisible) {
    map.removeLayer(heatLayer);
    heatMapLayerVisible = false;
  } else {
    map.addLayer(heatLayer);
    heatMapLayerVisible = true;
  }
});



// Toggle button to show/hide earthquake layer
const toggleButton = L.control({ position: "topright" });

toggleButton.onAdd = function (map) {
  const div = L.DomUtil.create("div", "info toggle-button");
  div.innerHTML = '<button id="toggleLayer" style="background: rgba(255, 121, 0, 0.2); border: 1px solid #ff7900; cursor: pointer; border-radius: 2px; padding-top: 5px; margin-left: -2px;"><img src="/images/quake.svg" alt="Toggle Earthquakes" style="width: 18px; height: 19px; filter: invert(38%) sepia(100%) saturate(1000%) hue-rotate(359deg) brightness(100%) contrast(120%);"></button>';
  return div;
};

toggleButton.addTo(map);

let earthquakeLayerVisible = true;

document.getElementById("toggleLayer").addEventListener("click", function () {
  if (earthquakeLayerVisible) {
    map.eachLayer(function (layer) {
      if (layer instanceof L.MarkerClusterGroup) {
        map.removeLayer(layer);
      }
    });
    earthquakeLayerVisible = false;
  } else {
    d3.json("data/worldQuakesMiles.json").then((data) => {
      const markers = L.markerClusterGroup({
        disableClusteringAtZoom: 8,
        maxClusterRadius: 50,
        iconCreateFunction: function (cluster) {
          return L.divIcon({
            html: `<div style="background-color: rgba(255, 121, 0, 0.6); border: 2px solid #ff7900; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-weight: regular; font-size: 10px; font-family: 'Open Sans', sans-serif;">${cluster.getChildCount()}</div>`,
            className: 'marker-cluster',
            iconSize: L.point(30, 30)
          });
        }
      });

      const earthquakes = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          const magnitude = feature.properties.mag;
          return L.circleMarker(latlng, {
            radius: Math.pow(magnitude, 1.2),
            fillColor: "#ff7900",
            color: "#ff7900",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.2,
          });
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(`
            <span style="font-family: 'Open Sans'; font-weight: regular; font-size: 10px;">Location
            <br/></span> <span style="font-family: 'Open Sans'; font-weight: bold; font-size: 14px; color: #ff7900;">${feature.properties.place}</span>
            <br/>
            <br/>
            <span style="font-family: 'Open Sans'; font-weight: regular; font-size: 10px;">Magnitude</span>
            <br/>
            <span style="font-family: 'Open Sans'; font-weight: bold; font-size: 14px; color: #ff7900;">${feature.properties.mag}</span>`);
        },
      });

      markers.addLayer(earthquakes);
      map.addLayer(markers);
    });
    earthquakeLayerVisible = true;
  }
});



//title - 100 Years of Earthquakes > 6.0 in Southeast Asia
const title = L.control({ position: "topleft" });
title.onAdd = function (map) {
  const div = L.DomUtil.create("div", "info title");
  div.style.color = "white";
  div.style.fontSize = "24px";
  div.style.fontWeight = "bold";
  div.style.fontFamily = "Open Sans, sans-serif";
  div.style.padding = "5px";
  div.innerHTML = "100 Years of Earthquakes<br/> around the World";
  return div;
};
title.addTo(map);

//legend - size of circle = magnitude
const legend = L.control({ position: "bottomright" });

legend.onAdd = function (map) {
  const div = d3.create("div").attr("class", "info legend").style("padding-right", "15px");

  const magnitudes = [10];
  const labels = [];

  magnitudes.forEach((mag) => {
    const size = Math.pow(mag, 1.8);
    labels.push(
      `<div style="position: relative; width: ${size * 2}px; height: ${size * 2}px;">
      <i style="background: rgba(255, 121, 0, 0.2); border: 2px solid #ff7900; width: ${size * 2}px; height: ${size * 2}px; border-radius: 50%; display: inline-block; position: absolute; top: 0; left: 0;">
      <svg width="${size * 2.5}" height="${size * 2.5}" viewBox="0 0 ${size * 2} ${size * 2}" style="position: absolute; top: -10%; left: -10%;">
      <defs>
      <path id="textPath${mag}" d="M ${size}, ${size} m -${size}, 0 a ${size},${size} 0 1,1 ${size * 2},0 a ${size},${size} 0 1,1 -${size * 2},0" />
      </defs>
      <text>
      <textPath href="#textPath${mag}" startOffset="7%" text-anchor="start" style="font-size: 9px; fill: #ffffff; font-family: 'Open Sans', sans-serif; font-weight: bold;">
      Magnitude
      </textPath>
      </text>
      </svg>
      </i>
      <i style="background: rgba(255, 121, 0, 0.4); border: 2px solid #ff7900; width: ${size * 1.5}px; height: ${size * 1.5}px; border-radius: 50%; display: inline-block; position: absolute; top: 25%; left: 25%;"></i>
      <i style="background: rgba(255, 121, 0, 0.5); border: 2px solid #ff7900; width: ${size}px; height: ${size}px; border-radius: 50%; display: inline-block; position: absolute; top: 50%; left: 50%;"></i>
      </div> M<sub>L</sub>`
    );
  });

  div.html(labels.join("<br>"));
  return div.node();
};

legend.addTo(map);


//timeline filter control showing earthquake by year with animation
const timelineControl = L.control({ position: "bottomleft" });

timelineControl.onAdd = function (map) {
  const div = d3.create("div").attr("class", "info timeline-control");
  
  const years = d3.range(1920, 2021);
  const label = div.append("label")
  .attr("for", "year")
  .style("margin", "2px")
  .style("font-family", "Open Sans, sans-serif")
  .style("font-size", "12px")
  .text(d3.min(years));

  //slider style
  const slider = div.append("input")
    .attr("type", "range")
    .attr("min", d3.min(years))
    .attr("max", d3.max(years))
    .attr("value", d3.min(years))
    .attr("step", 1)
    .style("width", "200px")
    .style("height", "8px")
    .style("background", "linear-gradient(to right, transparent, #ff7900)")
    .style("appearance", "none")
    .style("outline", "none")
    .style("border-radius", "2px")
    .style("cursor", "pointer")
    .style("padding-bottom", "10px")
    .style("border", "0.5px solid white");
    
    //slider thumb style
    const style = document.createElement('style');
    style.innerHTML = `
    input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 3px;
        height: 10px;
        background: #ff7900;
        cursor: pointer;
    }
    input[type=range]::-moz-range-thumb {
        width: 2px;
        height: 20px;
        background: #ff7900;
        cursor: pointer;
    }
    `;
    document.head.appendChild(style);



  slider.on("input", function () {
    const year = +this.value;
    label.text(year);

    // Filter earthquakes by year
    d3.json("data/worldQuakesMiles.json").then((data) => {
      const filteredData = data.features.filter(d => new Date(d.properties.time).getFullYear() === year);
      const earthquakes = L.geoJSON(filteredData, {
        pointToLayer: function (feature, latlng) {
          const magnitude = feature.properties.mag;
          return L.circleMarker(latlng, {
            radius: Math.pow(magnitude, 1.2),
            fillColor: "#ff7900",
            color: "#ff7900",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.2,
          });
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(`Location: ${feature.properties.place}<br>Magnitude: ${feature.properties.mag}`);
        },
      });

      // Fade out existing layers
      d3.selectAll(".leaflet-marker-pane, .leaflet-shadow-pane, .leaflet-overlay-pane")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .on("end", function () {
          // Clear existing layers
          map.eachLayer(function (layer) {
            if (layer instanceof L.MarkerClusterGroup) {
              map.removeLayer(layer);
            }
          });

          const markers = L.markerClusterGroup({
            disableClusteringAtZoom: 8,
            maxClusterRadius: 50,
            iconCreateFunction: function (cluster) {
              return L.divIcon({
                html: `<div style="background-color: rgba(255, 121, 0, 0.6); border: 2px solid #ff7900; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-weight: regular; font-size: 10px; font-family: 'Open Sans', sans-serif;">${cluster.getChildCount()}</div>`,
                className: 'marker-cluster',
                iconSize: L.point(30, 30)
              });
            }
          });

          markers.addLayer(earthquakes);
          map.addLayer(markers);

          // Fade in new layers
          d3.selectAll(".leaflet-marker-pane, .leaflet-shadow-pane, .leaflet-overlay-pane")
            .transition()
            .duration(500)
            .style("opacity", 1);
        });
    });
  });

  // Animate timeline
  function animateTimeline() {
    let yearIndex = 0;
    const interval = setInterval(() => {
      if (yearIndex >= years.length) {
        clearInterval(interval);
        return;
      }
      slider.property("value", years[yearIndex]).dispatch("input");
      yearIndex++;
    }, 1000); // Change year every 500ms
  }


  // play/pause button for animation
  let isPlaying = false;
  let interval;

  const playButton = div.append("button")
    .html('<img src="/images/play.svg" alt="Play" style="width: 12px; height: 12px; filter: invert(38%) sepia(100%) saturate(1000%) hue-rotate(359deg) brightness(100%) contrast(101%);">')
    .style("margin-right", "0px")
    .style("background", "none")
    .style("border", "none")
    .on("click", function() {
      if (isPlaying) {
        clearInterval(interval);
        isPlaying = false;
        playButton.html('<img src="/images/play.svg" alt="Play" style="width: 12px; height: 12px; filter: invert(38%) sepia(100%) saturate(1000%) hue-rotate(359deg) brightness(100%) contrast(101%);">');
      } else {
        animateTimeline();
        isPlaying = true;
        playButton.html('<img src="/images/pause.svg" alt="Pause" style="width: 12px; height: 12px; filter: invert(38%) sepia(100%) saturate(1000%) hue-rotate(359deg) brightness(100%) contrast(101%);">');
      }
    });

  div.node().insertBefore(playButton.node(), slider.node());


    
  function animateTimeline() {
    let yearIndex = years.indexOf(+slider.property("value"));
    interval = setInterval(() => {
      if (yearIndex >= years.length) {
        clearInterval(interval);
        isPlaying = false;
        playButton.html('<img src="/images/play.svg" alt="Play" style="width: 20px; height: 20px; filter: invert(38%) sepia(100%) saturate(1000%) hue-rotate(359deg) brightness(100%) contrast(101%);">');
        return;
      }
      slider.property("value", years[yearIndex]).dispatch("input");
      yearIndex++;
    }, 1000); // Change year every 1s
  }

  return div.node();
};

timelineControl.addTo(map);
