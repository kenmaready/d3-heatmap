import React from 'react';
import * as d3 from 'd3';
import './App.css';


class App extends React.Component {

    componentDidMount() {

        let req = new XMLHttpRequest();
        let dataURL = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";
        req.open('GET', dataURL, true);
        req.send();
        req.onload = () => {
            let json = JSON.parse(req.responseText);
            let base_temp = json.baseTemperature;
            let data = json.monthlyVariance.map( (d) => {
                return {...d, temp: base_temp + d.variance, month: d.month - 1};
            });
            let num_months = [...new Set(data.map( d => d.month))].length;
            let years = [...new Set(data.map(d => d.year))];
            let num_years = years.length;
            let low_temp = d3.min(data, (d) => d.temp);
            let high_temp = d3.max(data, (d) => d.temp);
            console.log(data);
            console.log(low_temp, high_temp);

            // set dimensions of chart
            const WIDTH = 900;
            const HEIGHT = 600;
            const PADDING = 60;
            const CELL_WIDTH = (WIDTH - (2 * PADDING)) / num_years;
            const CELL_HEIGHT = (HEIGHT - (2 * PADDING)) / (num_months);
            const MAP_COLORS = ["#F3F2F7", "#8E85F2", "#6B43E6", "#2B30CC", "#F7F7BC",
                                "#F2D17E", "#E39139", "#EB6C17", "#EB3E17", "#FF0000"]
            const TEMP_SEGMENT_LENGTH = (high_temp - low_temp) / MAP_COLORS.length;
            const TEMP_SEGMENTS = []
            for (let i = 0; i < MAP_COLORS.length; i++) {
                TEMP_SEGMENTS.push(low_temp + (i * TEMP_SEGMENT_LENGTH));
            } 
            console.log(TEMP_SEGMENTS);
            const MONTH_NAMES = ["January","February","March","April",
                                 "May","June","July","August",
                                 "September", "October","November","December"];
            const LEGEND_WIDTH = 200;
            const LEGEND_HEIGHT = 40;
            const LEGEND_PADDING = 10;
            const LEGEND_CELL_WIDTH = (LEGEND_WIDTH - (2 * LEGEND_PADDING)) / TEMP_SEGMENTS.length;

            // set scales for axes:
            let xScale = d3.scaleLinear()
                           .domain([d3.min(data, (d) => d.year), d3.max(data, (d) => d.year)])
                           .range([PADDING, WIDTH - PADDING]);
            let yScale = d3.scaleLinear()
                           .domain([d3.min(data, (d) => d.month), d3.max(data, (d) => d.month)])
                           .range([PADDING, HEIGHT - PADDING]);
            console.log(xScale(1753), xScale(2015), yScale(1), yScale(12));

            let svg = d3.select("#chart")
                        .append("svg")
                        .attr("preserveASpectRatio", "xMinYMin meet")
                        .attr("viewBox", "0 0 " + WIDTH + " " + HEIGHT)
                        .attr("id", "chart-content");
            
            // define the tooltip object
            const tooltip = d3.select("#chart")
                              .append("div")
                              .attr("class", "tooltip")
                              .attr("id","tooltip")
                              .style("opacity",0);
            
            svg.selectAll("rect")
               .data(data)
               .enter()
               .append("rect")
               .attr("class","cell")
               .attr("data-month", (d) => d.month)
               .attr("data-year", (d) => d.year)
               .attr("data-temp", (d) => d.temp)
               .attr("x", (d) => xScale(d.year))
               .attr("y", (d) => yScale(d.month) - (CELL_HEIGHT/2))
               .attr("width", CELL_WIDTH)
               .attr("height", CELL_HEIGHT)
               .style("fill", (d) => MAP_COLORS[Math.floor((d.temp - low_temp)/TEMP_SEGMENT_LENGTH)])
               .on("mouseover", (d,i) => {
                tooltip.transition()
                       .duration(200)
                       .style('opacity',.9);
                 tooltip.html(`<strong>` + MONTH_NAMES[d.month] + ' ' + d.year + `</strong><br>
                               <strong>Temp: </strong>` + Math.round(d.temp*1000)/1000 + 
                               `&deg;<br><strong>Variance: </strong>` + d.variance + `&deg;`)
                        .style('left', (xScale(d.year) - 150) + "px")
                        .style('top', yScale(d.month) + "px")
                        .attr("data-year", d.year);
            })
            .on('mouseout', (d) => {
                tooltip.transition()
                       .duration(200)
                       .style('opacity',0);
            });
            

            let xAxis = d3.axisBottom(xScale)
                          .tickFormat( (d) => d.toString() );
            svg.append("g")
               .attr("transform", "translate(0," + (HEIGHT - PADDING + (CELL_HEIGHT / 2)) + ")")
               .attr("id", "x-axis")
               .call(xAxis);

            let yAxis = d3.axisLeft(yScale)
                          .tickFormat( (d) => MONTH_NAMES[d]);
            svg.append("g")
               .attr("transform", "translate(" + PADDING + ", 0)")
               .attr("id","y-axis")
               .call(yAxis);
            
            // add legend at bottom:    

            let legend = d3.select("#legend")
                           .append("svg")
                           .attr("preserveASpectRatio", "xMinYMin meet")
                           .attr("viewBox", "0 0 " + LEGEND_WIDTH + " " + (LEGEND_HEIGHT + LEGEND_PADDING))
                           .attr("id", "legend-content");
            
            legend.append("text")
                  .attr("id","legend-intro")
                  .attr("x", LEGEND_PADDING)
                  .attr("y", LEGEND_PADDING)
                  .text("Legend:");

            legend.selectAll("rect")
                  .data(MAP_COLORS)
                  .enter()
                  .append("rect")
                  .attr("x", (d,i) => LEGEND_PADDING + (i * LEGEND_CELL_WIDTH))
                  .attr("y", 8 + LEGEND_PADDING)
                  .attr("height", LEGEND_CELL_WIDTH)
                  .attr("width", LEGEND_CELL_WIDTH)
                  .attr("fill", (d) => d);

            legend.selectAll("text")
                  .data([0,...TEMP_SEGMENTS])
                  .enter()
                  .append("text")
                  .attr("class","legend-labels")
                  .attr("x", (d,i) => (i * LEGEND_CELL_WIDTH))
                  .attr("y", LEGEND_HEIGHT + 4)
                  .attr("transform", (d,i) => "rotate(35, "+ (LEGEND_PADDING + (i * LEGEND_CELL_WIDTH)) +", "+ (LEGEND_HEIGHT + 4) +")")
                  .text( (d, i) => (`>` + Math.round(d*1000)/1000) + `°`);
            
            console.log(TEMP_SEGMENTS);
        }
    }
    
    render() {
        return (
            <div className="ui container">    
                <div className="ui segment">
                   <h2 id="title">Monthly Global Land-Surface Temperature 1753-2015</h2>
                   <h4 id="description">(base temperature 8.66&deg; Celsius)</h4>
                   <div id="chart"></div>
                   <div className="ui segment" id="legend"></div>
                </div>
            </div>
        );
    }
};

export default App;