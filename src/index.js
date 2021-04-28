import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as EE from './electronicEng.js';
import * as d3 from 'd3';

class Test extends React.Component {
    render() {
        const message = "This is a test";
        return (
            <div class="test">{message}</div>
        );
    }
}


class TestGraph extends React.Component {
    // XXX: Define const's somewhere else?

    // drawLine() {
    //     const minHeight = 200;
    //     const minWidth = 300;
    //     const margin = {top: 20, right: 20, bottom: 20, left: 40};

    //     // The note frequency is a binary logarithm scale.
    //     let xScale = d3.scaleLog().base(2)
    //         .domain(d3.extent(data, function(d) {return d.x}))
    //         .range([margin.left, width - margin.right]);

    //     // The Y axis is given as the decibel value which is already a common log
    //     // we need to keep the scale as linear. I think ... 
    //     let yScale = d3.scaleLinear()
    //         .domain([-12, 0]) //d3.extent(data, function(d) {return d.y}))
    //         .range([height - margin.top, margin.top]);
    //     // Also, we need to decide what an appropriate range is ...
    //     // At some point in the future, I will likely have data which shows
    //     // an active filter that results in a dBv gain.

    //     let line = d3.line()
    //         .x(function(item, incr) { return xScale(item.x); })
    //         .y(function(item, incr) { return yScale(item.y); })
    //         .curve(d3.curveMonotoneX)
        
    //     return (
    //         <path className="line" d={line(this.props.data)} />
    //     );
        
    // }

    render() {
        const width = 900;
        const height = 300;
        const farads = "1u";
        const ohms = "43k";
        const my_func = EE.getFilterDecibelFunc("RC", ohms, farads);
        const my_data = EE.getDataNotes(EE.genAENotes, my_func);
        const my_svg = EE.FilterDecibelNotesGraph(height, width, my_data);
        return <svg ref={my_svg} width={width} height={height}>{my_svg.node()}</svg>
        //<div class="foo">{my_svg}</div>
    }
}


class NewTest extends React.Component {
    constructor(props) {
        super(props);

        const farads = "10n";
        const ohms = "43k";
        const my_func = EE.getFilterDecibelFunc("RC", ohms, farads);
        const my_data = EE.getDataNotes(EE.genAENotes, my_func);
        this.state = {
            data: my_data,
            width: 900,
            height: 500,
            margin: {top: 20, right: 20, bottom: 20, left: 40}
        };

        for (const item of this.state.data) {
            console.log(
                "item: x: " + item.x + ", y: " + item.y + 
                ", xLabel: " + item.xLabel);
        }
    }

    componentDidMount() {
        this.createSvgContainer();
    }

    componentDidUpdate() {
        this.createSvgContainer();
    }

    createSvgContainer() {
        let svg = this.svg;

        d3.select(svg)
            .attr("width", this.state.width)
            .attr("height", this.state.height)
            .append("g");

        // Draw line:
        let xScale = d3.scaleLog().base(2)
            .domain(d3.extent(this.state.data, function(d) {return d.x}))
            .range([this.state.margin.left,
                this.state.width - this.state.margin.right]);

        let yScale = d3.scaleLinear()
            .domain([-12, 0]) //d3.extent(data, function(d) {return d.y}))
            .range([this.state.height - this.state.margin.top,
                this.state.margin.top]);

        let line = d3.line()
            .x(function(item, incr) { return xScale(item.x); })
            .y(function(item, incr) { return yScale(item.y); })
            .curve(d3.curveMonotoneX)

        d3.select(svg)
            .append("path")
            .datum(this.state.data) // 10. Binds data to the line 
            .attr("class", "line") // Assign a class for styling 
            .attr("d", line); // 11. Calls the line generator 

        // Draw X Axis
        let xVals = [];
        this.state.data.forEach(item => xVals.push(item.x));

        let getXLabel = (d, i) => this.state.data[i].xLabel; 
        var xAxis = d3.axisBottom()
            .scale(xScale)
            .tickValues(xVals)
            .tickSize(5)
            .tickFormat(getXLabel);

        d3.select(svg).append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 
                (this.state.height - this.state.margin.bottom) + ")")
            .call(xAxis);

        // Draw Y Axis
        let yVals = [];
        this.state.data.forEach(item => yVals.push(item.y));

        let getYLabel = (d, i) => String(d).concat("dB");

        let yAxis = d3.axisLeft()
            .scale(yScale)
            .tickSize(5)
            .tickFormat(getYLabel);

        d3.select(svg).append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + this.state.margin.left + ",0)")
            .call(yAxis);

    }

    render() {
        return (
            <div /*style={{width: "300px" }}*/ >
                <svg ref={svg => (this.svg = svg)}></svg>
                {/* SVG DOM node set as ref to use with React */}
            </div>
        );
    }
}


ReactDOM.render(
    // <Test/>, document.querySelector('#root')
    <NewTest/>, document.querySelector('#root')
    // <BarChart w=400 
);




