const chartSize = {width: 800, height: 600};
const margin = {left: 100, right: 10, top: 20, bottom: 150};
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const Rs = d => `${d} ₹`;
const kCrRs = d => `${d / 1000}k Cr ₹`;
const Percent = d => `${d}%`;
const fieldFormat = {CMP: Rs, MarketCap: kCrRs, DivYld: Percent, ROCE: Percent, QNetProfit: kCrRs, QSales: kCrRs};

const companyNameAsId = c => c.Name;
const transitionEffect = () => d3.transition().duration(500).ease(d3.easePolyIn);
const color = d3.scaleOrdinal(d3.schemeCategory10);

const updateChart = (companies, fieldName) => {
  const format = fieldFormat[fieldName];

  const svg = d3.select('#chart-area svg');
  const maxDomain = _.get(_.maxBy(companies, fieldName), fieldName, 0);
  const y = d3.scaleLinear()
      .domain([0, maxDomain])
      .range([height, 0]);

  svg.select('.y.axis-label').text(fieldName);

  const yAxis = d3.axisLeft(y)
      .ticks(10)
      .tickFormat(format);

  svg.select('.y.axis').call(yAxis);

  const x = d3.scaleBand()
      .domain(_.map(companies, 'Name'))
      .range([0, width])
      .padding(0.3);

  const xAxis = d3.axisBottom(x);
  svg.select('.x.axis').transition(transitionEffect()).call(xAxis);

  const companiesG = svg.select('.companies');

  const rects = companiesG.selectAll('rect').data(companies, companyNameAsId);

  rects
      .exit()
      .remove();

  rects.enter()
      .append('rect')
      .attr('fill', b => color(b.Name))
      .attr('y', y(0))
      .attr('x', c => x(c.Name))
      .merge(rects)
      .transition(transitionEffect())
      .attr('height', b => y(0) - y(b[fieldName]))
      .attr('y', b => y(b[fieldName]))
      .attr('x', b => x(b.Name))
      .attr('width', x.bandwidth);
};

const initChart = () => {
  const svg = d3.select('#chart-area svg')
      .attr('height', chartSize.height)
      .attr('width', chartSize.width);

  const g = svg.append('g')
      .attr('class', 'companies')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  g.append('text')
      .attr('class', 'x axis-label')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - margin.top);

  g.append('text')
      .attr('class', 'y axis-label')
      .attr('x', -(height / 2))
      .attr('y', -60);

  g.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)

  g.append('g')
      .attr('class', 'y axis');
};

const parseCompany = ({Name, ...rest}) => {
  _.forEach(rest, (v, k) => rest[k] = +v);
  return {Name, ...rest};
};
const nextName = (() => {
  let step = 0;
  const names = 'CMP,PE,MarketCap,DivYld,QNetProfit,QSales,ROCE'.split(',');
  return () => names[step++ % names.length];
})();

const frequentlyMoveCompanies = (src, dest) => {
  setInterval(() => {
    const c = src.shift();
    if (c) dest.push(c);
    else [src, dest] = [dest, src];

  }, 2000);
};

const startVisualization = (companies) => {
  initChart();
  updateChart(companies, nextName());
  setInterval(() => updateChart(companies, nextName()), 1000);
  frequentlyMoveCompanies(companies, []);

}
const main = () => {
  d3.csv('data/companies.csv', parseCompany).then(startVisualization);
}
window.onload = main;