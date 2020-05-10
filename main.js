const transitionDuration = 1000;
const margin = 20;

const rowConverter = d => {
    const parseDate = d3.timeParse('%Y-%m-%d');

    return {
        id: parseInt(d.id),
        title: d.title,
        artist: d.artist,
        date: parseDate(d.date),
        score: parseInt(d.score),
        link: d.link
    }
};

const mouseEvents = (selection, text) => {
    selection
        .on('mouseover', function() {
            d3.select(this)
                .transition('hover')
                .attr('fill', 'grey');

            selection.on('mousemove', () => {
                const bodyDOMElem = d3.select('body').node();
                const [mouseX, mouseY] = d3.mouse(bodyDOMElem);

                d3.select('#tooltip')
                    .style('left',  `${mouseX + 20}px`)
                    .style('top', `${mouseY}px`)
                    .html(this.getAttribute(text));
            });

            d3.select('#tooltip')
                .classed('hidden', false);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition('hover')
                .attr('fill', 'black');

            d3.select('#tooltip')
                .classed('hidden', true);

            selection.on('mousemove', null);
        });
};

const makeBarChart = dataset => {

    const width = document.querySelector('#right').clientWidth;
    const height = 5000;

    document.querySelector('h2').innerHTML = '';
    document.querySelector('h3').innerHTML = '';

    let chart = d3.select('#barChart')
        .attr('width', width)
        .attr('height', height);

    let xScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.average_score)])
        .range([margin, width - margin]);

    let yScale = d3.scaleBand()
        .domain(dataset.map(d => d.artist))
        .range([height - margin, margin])
        .paddingInner(0.25)
        .paddingOuter(0.25);

    let bars = chart.selectAll('rect')
        .data(dataset, d => d.id)
        .enter()
        .append('rect')
        .attr('x', margin)
        .attr('y', d => yScale(d.artist))
        .attr('height', yScale.bandwidth())
        .attr('average_score', d => `Average Score: ${d.average_score}/10`)
        .call(mouseEvents, 'average_score')
        .on('click', function(d) {
            makeLineChart(d);

            chart.selectAll('rect')
                .transition()
                    .duration(transitionDuration / 4)
                    .attr('x', margin)
                    .attr('width', d => xScale(d.average_score) - margin);

            d3.select(this)
                .transition()
                    .duration(transitionDuration / 4)
                    .attr('x', 0)
                    .attr('width', width);
        })
        .transition()
            .delay((d, i) => i * -2)
            .duration(transitionDuration)
            .attr('width', d => xScale(d.average_score) - margin);

    chart.selectAll('text')
        .data(dataset)
        .enter()
        .append('text')
        .attr('x', margin + 10)
        .attr('y', d => yScale(d.artist) + yScale.bandwidth() / 2)
        .text(d => d.artist)
        .attr('fill', 'white')
        .style('font-family', 'effra-bold')
        .style('alignment-baseline', 'middle');

    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisLeft(yScale);

    let xAxisGroup = chart.append('g')
        .attr('class', 'barAxis')
        .attr('transform', `translate(0, ${height - margin})`)
        .call(xAxis);

    let yAxisGroup = chart.append('g')
        .attr('class', 'barAxis')
        .attr('transform', `translate(${margin}, 0)`)
        .call(yAxis);
};

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
let xAxisGroup, yAxisGroup;
let path, pathLength;

const makeLineChart = d => {

    document.querySelector('h2').innerHTML = d.artist;
    document.querySelector('h3').innerHTML = `Average Score: ${d.average_score}/10`;
    document.querySelector('p').innerHTML = `<br><br><br>`;
    d3.select('#lineChart').classed('hidden', false);

    const width = document.querySelector('#left').clientWidth - margin * 3;
    const height = 250;

    if (path) {
        d3.select('#lineChart')
            .selectAll('circle')
            .transition()
            .duration(transitionDuration)
            .attr('r', 0)
            .remove();

        path.transition()
            .duration(transitionDuration)
            .ease(d3.easeQuad)
            .attr('stroke-dashoffset', -pathLength);
    }

    let chart = d3.select('#lineChart')
        .attr('width', width)
        .attr('height', height);

    let xScale = d3.scaleTime()
        .domain(d3.extent(d.albums, d => d.date))
        .range([margin * 2, width - margin]);

    let yScale = d3.scaleLinear()
        .domain([0, 10])
        .range([height - margin, margin]);

    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.score));

    path = chart.append('path')
        .datum(d.albums)
        .attr('class', 'line')
        .attr('d', line)
        .attr('fill', 'none');

    pathLength = path.node().getTotalLength();

    path
        .attr('stroke-dasharray', pathLength + ' ' + pathLength)
        .attr('stroke-dashoffset', pathLength)
        .transition()
            .delay(transitionDuration)
            .duration(transitionDuration)
            .ease(d3.easeQuad)
            .attr('stroke-dashoffset', 0);

    let circles = chart.selectAll('circle')
        .data(d.albums, d => d.id)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.score))
        .attr('title', d => d.title)
        .call(mouseEvents, 'title')
        .on('click', function(d) {
            document.querySelector('h3').innerHTML = d.title;
            document.querySelector('p').innerHTML =
                `Reviewed on ${monthNames[d.date.getMonth()]} ${d.date.getDay()}, ${d.date.getFullYear()}
                <br>Score: ${d.score}/10
                <br><a href='` + d.link + `' target='_blank'>Watch the Review</a>`;

            chart.selectAll('circle')
                .transition()
                    .duration(transitionDuration / 4)
                    .attr('r', 7);

            d3.select(this)
                .transition()
                    .duration(transitionDuration / 4)
                    .attr('r', 15);
        })
        .transition()
            .delay(transitionDuration)
            .duration(transitionDuration)
            .attr('r', 7);

    let xAxis = d3.axisBottom(xScale);
    xAxis.tickFormat(d3.timeFormat('%Y'));
    xAxis.ticks(d3.timeYear.every(1));

    let yAxis = d3.axisLeft(yScale);

    if (!xAxisGroup && !yAxisGroup) {
        xAxisGroup = chart.append('g')
            .attr('class', 'lineAxis')
            .attr('transform', `translate(0, ${height - margin})`);

        yAxisGroup = chart.append('g')
            .attr('class', 'lineAxis')
            .attr('transform', `translate(${margin}, 0)`);
    }

    xAxisGroup
        .transition('axis')
        .duration(transitionDuration)
        .call(xAxis);

    yAxisGroup
        .transition('axis')
        .duration(transitionDuration)
        .call(yAxis);
};

window.onload = () => {
    d3.csv('data.csv', rowConverter)
        .then((dataset) => {

            const groups = dataset.reduce((groups, album) => {
                if (!groups[album.artist]) {
                    groups[album.artist] = [];
                }
                groups[album.artist].push(album);
                return groups;
            }, {});

            const groupArrays = Object.keys(groups).map((artist) => {
                return {
                    artist,
                    albums: groups[artist]
                };
            });

            const result = groupArrays.filter(d => d.albums.length >= 3);

            result.forEach(d => {

                d.average_score = d.albums.reduce(function (accumulator, currentValue) {
                    return accumulator + currentValue.score;
                }, 0);

                d.average_score /= d.albums.length;
                d.average_score = d.average_score.toFixed(1);
            });

            result.sort((a, b) => {
                return a.average_score - b.average_score;
            });

            makeBarChart(result);
        });
};