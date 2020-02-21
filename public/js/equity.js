const chartSize = {width: 1500, height: 700};
const margin = {left: 100, right: 10, top: 20, bottom: 80};
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const changeChartRange = function (records, averages, [startIndex, endIndex]) {
  const recordsInRange = records.slice(startIndex, endIndex);
  const averagesInRange = _.filter(averages,
      (average) => average.date >= recordsInRange[0].Date && average.date <= _.last(recordsInRange).Date);
  updateChart(recordsInRange, averagesInRange)
};

const createSlider = function (records, onChangeFn) {
  const slider = d3
      .sliderBottom()
      .min(0)
      .max(records.length - 1)
      .width(600)
      .tickFormat(index => records[_.floor(index)].Date.toString().split(" ")[3])
      .ticks(10)
      .fill('#3498db')
      .default([0, records.length - 1])
      .on('onchange', onChangeFn);

  const gTime = d3
      .select('#data-controls #range-slider')
      .attr('width', 700)
      .attr('height', 100)
      .select('g')
      .attr('transform', 'translate(30,30)');

  gTime.call(slider)
};

const createAvgCountInput = function (onChangeFn) {
  d3.select("#avg-count-input")
      .attr('value', 100)
      .on("input", function () {
        onChangeFn(this.value || 100)
      });
};

const reCalculateAverage = function (records, avgCount) {
  updateChart(records, analyseData(records, avgCount))
};

const createControls = function (records, averages) {
  createSlider(records, changeChartRange.bind(null, records, averages));
  createAvgCountInput(reCalculateAverage.bind(null, records));
};

const initChart = () => {
  const svg = d3.select('#chart-area svg')
      .attr('height', chartSize.height)
      .attr('width', chartSize.width);

  const g = svg.append('g')
      .attr('class', 'prices')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  g.append('text')
      .attr('class', 'x axis-label')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - margin.top)
      .text('Time');

  g.append('text')
      .attr('class', 'y axis-label')
      .attr('x', -(height / 2))
      .attr('y', -60)
      .text('Close Price');

  g.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)

  g.append('g')
      .attr('class', 'y axis');

  g.append('path')
      .attr('class', 'close');

  g.append('path')
      .attr('class', 'avg');
};

const updateChart = (records, averages) => {
  const firstDay = _.first(records);
  const lastDay = _.last(records);

  const svg = d3.select('#chart-area svg');

  const x = d3.scaleTime()
      .domain([firstDay.Date, lastDay.Date])
      .range([0, width]);

  const xAxis = d3.axisBottom(x);

  svg.select('.x.axis').call(xAxis);


  const minDomain = _.min([_.minBy(records, 'Close').Close, _.minBy(averages, 'avg').avg])
  const maxDomain = _.max([_.maxBy(records, 'Close').Close, _.maxBy(averages, 'avg').avg])

  const y = d3.scaleLinear()
      .domain([minDomain, maxDomain])
      .range([height, 0]);

  const yAxis = d3.axisLeft(y)
      .ticks(10);

  svg.select('.y.axis').call(yAxis);

  const line = d3.line()
      .x(q => x(q.Date))
      .y(q => y(q.Close));

  const avgLine = d3.line()
      .x(q => x(q.date))
      .y(q => y(q.avg));


  const g = svg.select('.prices');

  g.select(".close")
      .attr("d", line(records));

  g.select(".avg")
      .attr("d", avgLine(averages));
};


const recordTransaction = function (average, record, transactions) {
  const lastTransaction = _.last(transactions);

  if (average.avg <= record.Close) {
    if (!lastTransaction || lastTransaction.sell) {
      return transactions.push({buy: record.Close, buyDate: record.Date})
    }
  }

  if (average.avg > record.Close && lastTransaction && !lastTransaction.sell) {
    transactions[transactions.length - 1] = {
      ...lastTransaction,
      sell: record.Close,
      sellDate: record.Date,
      change: record.Close - lastTransaction.buy
    }

  }
};

const appendChildren = (parent, children) => children.forEach(child => parent.appendChild(child));

const createElements = (tag, values) => values.map(value => {
  const element = document.createElement(tag);
  element.innerHTML = value;
  return element;
});

const summary = transactions => {
  const winTransactions = transactions.filter(transaction => transaction.change >= 0);
  const lossTransactions = transactions.filter(transaction => transaction.change < 0);

  const played = transactions.length;
  const wins = winTransactions.length;
  const loses = lossTransactions.length;
  const avgWin = winTransactions.reduce((sum, {change}) => sum + change, 0) / wins;
  const winPer = _.floor((wins/played) * 100);
  let avgLoss = lossTransactions.reduce((sum, {change}) => sum + change, 0) / loses;
  avgLoss = Math.abs(avgLoss);
  const net = transactions.reduce((sum, {change}) => sum + change, 0);

  return {played, wins, winPer, loses, avgWin, avgLoss, net};
};



const displayTransactionsSummary = ({played, wins, winPer, loses, avgWin, avgLoss, net}) => {
  const table = document.getElementById('transactions-summary-table');
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const tds = createElements('td',[played, wins, winPer + " %", loses, _.floor(avgWin), _.floor(avgLoss), _.floor(net)].reverse());
  appendChildren(tbody, tds);
  table.replaceChild(tbody, table.getElementsByTagName('tbody')[0]);


  const headThs = createElements('th',['Played', 'Wins', 'win %', 'Loses', 'Avg Win Amount', 'Avg Loss Amount', 'Net'].reverse());

  appendChildren(thead, headThs);
  table.replaceChild(thead, table.getElementsByTagName('thead')[0]);
};


const displayTransactions = (transactions) => {
  const table = document.getElementById('transactions-table');

  const thead = document.createElement("thead");
  const tds = createElements('th', ['S.No', 'Buy', 'Buy Date', 'Sell', 'Sell Date', 'Change']);
  appendChildren(thead, tds);
  table.replaceChild(thead, table.getElementsByTagName('thead')[0]);

  let sno = 0;

  const tbody = document.createElement("tbody");

  transactions.forEach(transaction => {
    const row = document.createElement("tr");

    const tds = createElements('td',
        [++sno,
          _.floor(transaction.buy),
          transaction.buyDate.toLocaleDateString(),
          _.floor(transaction.sell),
          transaction.sellDate.toLocaleDateString(),
          _.floor(transaction.change)]);

    appendChildren(row, tds);
    tbody.appendChild(row);
  });

  table.replaceChild(tbody, table.getElementsByTagName('tbody')[0]);
};

const analyseData = (records, avgCount = 100) => {
  const averages = [];
  const transactions = [];

  const recordsFromCount = records.slice(avgCount);
  const firstCountRecords = records.slice(0, avgCount);

  recordsFromCount.reduce((last100Records, record) => {
    const sum = last100Records.reduce((sum, record) => sum + record.Close, 0);
    const averageRecord = {date: record.Date, avg: Math.round(sum / avgCount)};
    averages.push(averageRecord);
    last100Records.shift();
    last100Records.push(record);

    recordTransaction(averageRecord, record, transactions);

    return last100Records;
  }, firstCountRecords);

  if (_.last(transactions).sell === undefined) {
    _.last(transactions).sell = _.last(records).Close;
    _.last(transactions).sellDate = _.last(records).Date;
    _.last(transactions).change = _.last(transactions).sell - _.last(transactions).buy;
  }

  displayTransactions(transactions);
  displayTransactionsSummary(summary(transactions));

  console.log(transactions);

  return averages;
};

const startVisualization = (records) => {
  initChart();
  const averages = analyseData(records);
  updateChart(records, averages);
  createControls(records, averages);
};

const parseData = ({Date, Volume, AdjClose, ...rest}) => {
  Date = new window.Date(Date);
  _.forEach(rest, (v, k) => rest[k] = +v);
  return {Date, ...rest};
};

const main = () => {
  d3.csv('data/NSEI.csv', parseData).then(startVisualization);
};

window.onload = main;