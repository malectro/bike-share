import * as I from './utils/async-iterator';
import * as P from './utils/point';
import {Rect} from './utils/rect';
import * as d3Geo from 'd3-geo';

const colors = {
  stationBikeTrip: 'rgba(255, 210, 210, 1)',
  ebikeTrip: 'rgb(255, 210, 255)',
  station: 'rgba(210, 210, 255, 1)',
  ebikeStop: 'rgb(210, 255, 210)',
  background: 'black',
  text: 'white',
};

async function main() {
  const ratio = window.devicePixelRatio;
  const width = window.innerWidth;
  const height = window.innerHeight;

  const canvas = createElement(document, 'canvas', {
    width: width * ratio,
    height: height * ratio,
  });

  Object.assign(canvas.style, {
    background: colors.background,
    width: '100vw',
    height: '100vh',
  });

  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  //ctx.scale(ratio, ratio);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255, 210, 210, 1)';
  ctx.fillStyle = 'rgba(210, 210, 255, 1)';

  const sfBounds = [
    [-122.5682345, 37.8013377],
    [-122.4041262, 37.813544],
    [-122.3951998, 37.694922],
    [-122.5483218, 37.705652],
  ];
  const sfCenter = [-122.4527064, 37.7633836];

  const maxMin = [-121.8679663539, 37.8802224459, -122.4761036038, 37.3184498];
  const min = {x: maxMin[2], y: maxMin[3]};
  const max = {x: maxMin[0], y: maxMin[1]};
  const delta = P.subtract(P.copy(max), min);

  const padding = 20;

  const projection = d3Geo
    .geoTransverseMercator()
    .rotate([-sfCenter[0] + 30 / 60, -sfCenter[1] - 50 / 60])
    //.center(sfCenter)
    //.translate([Math.floor(width / 2), Math.floor(height / 2)])
    //.scale(60000)
    /*
    .center([min.x + delta.x / 2, min.y + delta.y / 2])
    .translate([Math.floor(width / 2), Math.floor(height / 2)])
    .scale(200)
    .clipExtent([[padding, padding], [canvas.width - padding, canvas.height - padding]])
    */
    //.rotate([74 + 30 / 60, -38 - 50 / 60])
    .fitExtent(
      [
        [padding, padding],
        [canvas.width - padding, canvas.height - padding],
      ],
      {
        type: 'MultiPoint',
        coordinates: sfBounds,
        /*
        coordinates: [
          [min.x, min.y],
          [max.x, max.y],
        ],
        */
      },
    );

  /*
  console.log('center', projection.center());
  console.log('translate', projection.translate());
  console.log('scale', projection.scale());
  console.log('rotate', projection.rotate());
  */

  const maxDelta = Math.max(delta.x, delta.y);
  //const padding = P.scale(P.point(maxDelta, maxDelta), 0.2);

  const bounds = Rect.fromBounds(
    min,
    max,
    /*
    P.subtract(P.copy(min), padding),
    P.add(P.copy(max), padding),
    */
  );

  console.log('bounds', bounds);

  const response = await fetch('202110-baywheels-tripdata.sorted.csv');

  const decoder = new TextDecoder();

  let first = true;
  const rideTypes = new Set();
  const result = await I.flush(
    I.fromStream(response.body),
    (i) => I.map(i, (array) => decoder.decode(array)),
    breakUpLines,
    parseCsv,
    //i => I.seak(i, item => item.start_time > '2019-12-20'),
    //i => I.filter(i, item => !item.start_station_id || !item.end_station_id),
    /*
    i => I.take(i, 1000),
    i =>
      I.reduce(
        i,
        (acc, item) => {
          const {end_station_latitude: y, end_station_longitude: x} = item;

          acc[0] = Math.max(acc[0], x);
          acc[1] = Math.max(acc[1], y);
          acc[2] = Math.min(acc[2], x);
          acc[3] = Math.min(acc[3], y);

          return acc;
        },
        [-Infinity, -Infinity, Infinity, Infinity],
      ),
      */
    //i => I.take(i, 1000),
    (i) => I.buffer(i, 10),
    I.animate,
    (i) =>
      I.map(i, (group) => {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
        ctx.fillRect(0, 0, 100000, 100000);
        ctx.restore();

        for (const member of group) {
          /*
        const start = P.point(
          member.start_station_longitude,
          member.start_station_latitude,
        );
        const end = P.point(
          member.end_station_longitude,
          member.end_station_latitude,
        );

        console.log('hio', projection([start.y, start.x]));

        bounds.project(start);
        bounds.project(end);
        */

       rideTypes.add(member.rideable_type);

          const startsOnStation = member.start_station_id;
          const endsOnStation = member.end_station_id;
          const isDockless = !startsOnStation || !endsOnStation;
          const isEbike = member.rideable_type !== 'classic_bike';

          const start = projection([
            parseFloat(member.start_station_longitude || member.start_lng),
            parseFloat(member.start_station_latitude || member.start_lat),
          ]);
          const end = projection([
            parseFloat(member.end_station_longitude || member.end_lng),
            parseFloat(member.end_station_latitude || member.end_lat),
          ]);

          //console.log('hi', member, start, end);

          ctx.beginPath();
          /*
        ctx.moveTo(
          start.x * canvas.width,
          start.y * canvas.height,
        );
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        */
          ctx.fillStyle = startsOnStation ? colors.station : colors.ebikeStop;
          ctx.arc(start[0], start[1], 2, 0, 2 * Math.PI);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(start[0], start[1]);
          ctx.lineTo(end[0], end[1]);
          ctx.strokeStyle = isEbike ? colors.ebikeTrip : colors.stationBikeTrip;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(end[0], end[1], 2, 0, 2 * Math.PI);
          ctx.fillStyle = endsOnStation ? colors.station : colors.ebikeStop;
          ctx.fill();

          ctx.fillStyle = colors.background;
          ctx.fillRect(0, 0, 600, 200);

          ctx.fillStyle = colors.text;
          ctx.font = '28px sans-serif';
          ctx.fillText(member.start_time || member.started_at, 10, 28 + 10);
          if (first) {
            first = false;
            console.log('example', member);
          }
        }
      }),
  );

  console.log('ride types', rideTypes);
  console.log('result', result);

  /*
  for await (const chunk of I.take(
    I.reChunk(
      I.map(I.fromStream(response.body), array => decoder.decode(array)),
      (newChunk, item) => {
        const index = item.indexOf("\n");
        if (index >= 0) {
          return {
            chunk: newChunk + item.slice(0, index),
            buffer: item.slice(index + 1)
          };
        }
        return { chunk: null, buffer: newChunk + item };
      },
      ""
    ),
    10
  )) {
    console.log("chunk", chunk);
  }
  */

  /*

  const reader = response.body.getReader();

  const limit = 10;
  let count = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done || count > limit) {
      break;
    }

    count++;

    console.log('chunk', value);
  }
  */
}
main();

/*
import * as Leaflet from 'leaflet';

const map = createElement(document, 'div', {
  id: 'map',
});

map.style.height = window.innerHeight + 'px';
map.style.width = window.innerWidth + 'px';

Leaflet.map(map, {
  center: [51.505, -0.09],
  zoom: 13,
});

document.body.appendChild(map);
*/

console.log('ready');

function createElement(document, tag, props) {
  return Object.assign(document.createElement(tag), props);
}

function breakUpLines(iterator) {
  return I.reChunk(
    iterator,
    (newChunk, item) => {
      const index = item.indexOf('\n');
      if (index >= 0) {
        return {
          chunk: newChunk + item.slice(0, index),
          buffer: item.slice(index + 1),
        };
      }
      return {chunk: null, buffer: newChunk + item};
    },
    '',
  );
}

async function* parseCsv(iterator: AsyncIterableIterator<string>) {
  const delimeter = ',';
  const {value, done} = await iterator.next();

  if (done) {
    throw new Error('No headers in csv!');
  }

  const headers = value.split(delimeter);

  for await (const row of iterator) {
    const record = {};
    const columns = row.split(delimeter);
    for (let i = 0; i < columns.length; i++) {
      const header = headers[i];
      if (header != null) {
        record[header] = columns[i];
      }
    }
    yield record;
  }
}
