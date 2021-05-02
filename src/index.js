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
            farads: farads,
            ohms: ohms,
            data: data,
            errorMessage: "No error",
            dimensions: null
        };

    }

    componentDidMount() {}

    componentDidUpdate() {}

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


    render() {
        return (
            <div
                className={`
                    p-4
                    p-4 m-4 border-2
                    items-center space-x-4`}
            >
                <span className="title">Farads:</span>
                <input 
                    className="textfield"
                    type="text" value={this.state.farads}
                    onChange={e => this.handleInputChange(e)}
                ></input>
                <span className="label">Ohms:</span>
                <input className="textfield"
                    type="text" value={this.state.width}
                    onChange={e => this.handleInputChange(e)}></input>
                <div className="justift-start flex p-4 boarder-1">
                    <div className={`text
                        w-1/3 
                        p-4 m-4 border-2
                        `}>
                    This is like something for the paper.. Umm.. Yeah... 
                    This is like something for the paper.. Umm.. Yeah... 
                    This is like something for the paper.. Umm.. Yeah... 
                    This is like something for the paper.. Umm.. Yeah... 
                    This is like something for the paper.. Umm.. Yeah... 
                    This is like something for the paper.. Umm.. Yeah... 
                    </div>
                    <div className={`
                        w-2/3
                        p-4 m-4 border-2
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
            {/*<div id="errorMessage">{this.state.errorMessage}</div>*/}
            </div>
        );
    }
}

class PageBase extends React.Component {
    
    render() {
        return (
            <div className="w-9/12">
                <div className="w-100 bg-gray-500 h-16 shadow-xl p-4">
                    <div>Menu</div>
                </div>
                <DecibelFilterGraphControlPanel width={900} height={300} />
            </div>
        );
    }
}


ReactDOM.render(
    <PageBase />,
    document.querySelector('#root')
);




