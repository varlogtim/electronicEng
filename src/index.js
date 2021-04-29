import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as EE from './electronicEng.js';
import * as d3 from 'd3';


class DecibelFilterGraph extends React.Component {
    // https://aspenmesh.io/using-d3-in-react-a-pattern-for-using-data-visualization-at-scale/
    // Giving D3 DOM control when we reload.
    constructor(props) {
        super(props);

        if (!props.width) {
            // XXX There is a prop-types library to use here.
            console.error("Width must be specified");
        }
        console.log("Graph Constructor");

        this.state = {
            margin: {top: 20, right: 20, bottom: 20, left: 40},
            width: props.width,
            height: props.height,
            data: props.data
        };
    }
    componentWillReceiveProps(nextProps) {
        this.setState(nextProps)
    }

    componentDidMount() {
        // https://reactjs.org/docs/state-and-lifecycle.html
        this.createSvgContainer();
    }

    componentDidUpdate() {
        // this.setState({ data: my_data });
        this.createSvgContainer();
    }

    createSvgContainer() {
        console.log("SVG CONTAINER CREATE");
        // Set Bounds
        d3.select(this.svg)
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

        // So, we need to determine what we should redraw.
        d3.select(this.svg).selectAll("path").remove();
        d3.select(this.svg)
            .append("path")
            .datum(this.state.data)
            .attr("class", "line")
            .attr("d", line);

        // Remove axes
        d3.select(this.svg).selectAll("g").remove();

        // Draw X Axis
        let xVals = [];
        this.state.data.forEach(item => xVals.push(item.x));

        let getXLabel = (d, i) => this.state.data[i].xLabel; 
        var xAxis = d3.axisBottom()
            .scale(xScale)
            .tickValues(xVals)
            .tickSize(5)
            .tickFormat(getXLabel);

        d3.select(this.svg).append("g")
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

        d3.select(this.svg).append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + this.state.margin.left + ",0)")
            .call(yAxis);

    }

    render() {
        return (
            <div /*style={{width: "300px" }}*/>
            {/* https://reactjs.org/docs/refs-and-the-dom.html#callback-refs */}
                <svg 
                    ref={svg => this.svg = svg}
                ></svg>
            </div>
        );
    }
}

class DecibelFilterGraphControlPanel extends React.Component {
    constructor(props) {
        super(props);
        
        // maybe this should be default.
        const farads = "47n";
        const ohms = "43k";
        const func = EE.getFilterDecibelFunc("RC", ohms, farads);
        const data = EE.getDataNotes(EE.genAENotes, func);

        this.state = {
            graphWidth: props.width,
            graphHeight: props.height,
            farads: farads,
            ohms: ohms,
            data: data,
            errorMessage: "No error"
        };

    }

    componentDidMount() {

    }

    // updateFarads(farads) {
    //     // this.state.farads = farads;
    //     this.state.farads = farads;
    // }

    handleInputChange(e) {
        let farads = e.target.value;
        // Validate value
        // this.state.farads = farads;
        try {
            const my_func = EE.getFilterDecibelFunc(
                "RC", this.state.ohms, farads);
            const my_data = EE.getDataNotes(EE.genAENotes, my_func);

            this.setState({
                farads: farads,
                data: my_data,
                errorMessage: ""
            });
        } catch (e) {
            console.log(e.message);
            this.setState({
                errorMessage: e.message
            });
        }
        console.log("Input changed: " + this.state.farads);
    }


    handleWidthChange(e) {
        let width = e.target.value;
        this.setState({ graphWidth: width });
    }
    
    render() {
        return (
            <div className="controlPanel">
                <span className="title">This is a title</span>
                <input type="text" value={this.state.farads}
                    onChange={e => this.handleInputChange(e)}
                ></input>
                <button text="foo"
                    onClick={(div) => console.dir(div)}
                >Click Me</button>
                <span className="label">Width:</span>
                <input type="text" value={this.state.width}
                    onChange={e => this.handleWidthChange(e)}></input>

                <div id="graph"></div>
                <DecibelFilterGraph
                    height={this.state.graphHeight}
                    width={this.state.graphWidth}
                    farads={this.state.farads}
                    ohms={this.state.ohms}
                    data={this.state.data}
                />
                <div id="errorMessage">{this.state.errorMessage}</div>
            </div>
        );
    }
}

ReactDOM.render(
    <DecibelFilterGraphControlPanel width={900} height={300} />,
    document.querySelector('#root')
);




