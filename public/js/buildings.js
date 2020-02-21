const showData = (buildings) => {
  const buildingsDiv = d3.select('#chart-data').append('div').attr('class', 'buildings');
 
  buildingsDiv.selectAll('.building')
    .data(buildings)
    .enter()
    .append('div')
    .attr('class','building')
    .html(b=>`<strong>${b.name}</strong> <i>${b.height}</i><hr/>`); 
      
};

const drawChart = (buildings) => {
  const chartSize = { width: 600, height: 400 };
  const margin = { left: 100, right: 10, top: 10, bottom: 150 };

  const svg = d3.select('#chart-area').append('svg')
    .attr('height', chartSize.height)
    .attr('width', chartSize.width);

  const width = chartSize.width - margin.left - margin.right;
  const height = chartSize.height - margin.top - margin.bottom;

  const y = d3.scaleLinear()
    .domain([0, _.maxBy(buildings, 'height').height])
    .range([0, height]);

  const x = d3.scaleBand()
    .domain(_.map(buildings, 'name'))
    .range([0, width])
    .padding(0.3);

  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y)
    .ticks(3)
    .tickFormat(d => `${d}m`);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  g.append('text')
    .attr('class', 'x axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - margin.top)
    .text('Tall Buildings');

  g.append('text')
    .attr('class', 'y axis-label')
    .attr('x', -(height / 2))
    .attr('y', -60)
    .text('Height (m)');

  g.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis);

  g.append('g')
    .attr('class', 'y axis')
    .call(yAxis);


  const rects = g.selectAll('rect').data(buildings);
  const newRects = rects.enter();
  newRects.append('rect')
    .attr('x', b => x(b.name))
    .attr('y', 0)
    .attr('width', x.bandwidth)
    .attr('height', b => y(b.height))
    .attr('fill', 'grey');
};

const drawBuildings = (buildings) => {
  showData(buildings);
  drawChart(buildings);
};

const main = () => {
  d3.json('data/buildings.json').then(drawBuildings);
}
window.onload = main;