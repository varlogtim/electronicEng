import React from 'react';
import * as EE from './electronicEng.js';
import * as d3 from 'd3';


export class DecibelFilterGraph extends React.Component {
    // https://aspenmesh.io/using-d3-in-react-a-pattern-for-using-data-visualization-at-scale/
    // Giving D3 DOM control when we reload.
    constructor(props) {
        super(props);

        if (!props.width) {
            // XXX There is a prop-types library to use here.
            console.error("Width must be specified");
        }

        this.state = {
            margin: {top: 5, right: 10, bottom: 15, left: 35},
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
        // Set Bounds
        // https://blog.logrocket.com/make-any-svg-responsive-with-this-react-component/
        let viewBox = [0, 0, this.state.width, this.state.height];

        d3.select(this.svg)
            .attr("viewBox", viewBox.join(" "));
            // .attr("width", this.state.width)
            // .attr("height", this.state.height)
            // .append("g");

        // Draw line:
        let xScale = d3.scaleLog().base(2)
            .domain(d3.extent(this.state.data, function(d) {return d.x}))
            .range([this.state.margin.left,
                this.state.width - this.state.margin.right]);

        let yScale = d3.scaleLinear()
            .domain([-12, 0]) //d3.extent(data, function(d) {return d.y}))
            .range([this.state.height -
                    this.state.margin.bottom,
                    this.state.margin.top + this.state.margin.bottom]);

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


export class DecibelFilterGraphControlPanel extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            farads: props.farads,
            ohms: props.ohms,
            type: props.type,
            errorMessage: "",
            data: null,
            dimensions: null
        };

        let state = this.state;
        this.setNewData(state);
        // ^ this seems like a strange pattern.
        // What I need is to hook into pre-update of the component
        // and make sure that I reprocess the data before we redraw.
        //
        // I guess I will think about this more later.

    }

    componentDidMount() {}

    componentDidUpdate() {}

    setNewData(state) {
        try {
            // XXX handle different filters.
            const func = EE.getFilterDecibelFunc(
                state.type, state.ohms, state.farads);
            const data = EE.getDataNotes(EE.genAENotes, func);
            state.data = data;
            this.setState(state);
        } catch (e) {
            console.log(e.message);
            this.setState({
                errorMessage: e.message
            });
        }
    }
    
    handleValueChange(name, e) {
        let state = this.state;
        state[name] = e.target.value;
        this.setNewData(state);
    }
    
    onFilterChange(event) {
        let state = this.state;
        state[event.target.name] = event.target.value;
        this.setNewData(state);
    }

    render() {
        return (
<div className="flex justify-start p-2 border">
    <div className="block border border-grey-400">
        <div className="block p-2" onChange={e => this.onFilterChange(e)}>
            <input className="inline space-x-4"
                type="radio" value="RC" name="type" 
                checked={this.state.type === "RC"} />
            <span className="p-1">RC Filter</span>
            <input className="inline"
                type="radio" value="CR" name="type"
                checked={this.state.type === "CR"} />
            <span className="p-1">CR Filter</span>
        </div>
        <div className="inline p-2">
            <input 
                className="textfield flex-grow-0 w-16"
                type="text" value={this.state.farads}
                onChange={e => this.handleValueChange("farads", e)}
            ></input>
            <span className="label pl-1">F</span>
        </div>
        <div className="inline p-2">
            <input
                className="textfield flex-grow-0 w-16"
                type="text" value={this.state.ohms}
                onChange={e => this.handleValueChange("ohms", e)}
            ></input>
            <span className="label pl-1">&#8486;</span>
        </div>
    </div>
    <div className={`
        w-1/2 p-0 border flex-auto
        `}>
        <DecibelFilterGraph
            height={300}
            width={900}
            farads={this.state.farads}
            ohms={this.state.ohms}
            data={this.state.data}
        />
    </div>
</div>
        );
    }
}

