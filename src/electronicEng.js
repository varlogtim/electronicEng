/**
 * Goals:
 *  - Graph R/C frequency response
 *  - Graph C/R frequency responses
 *  - Graph Big Muff filter section response.
 *
 * So, we basically need to pass in a bunch of X values
 * and have this return a bunch of Y values. This means
 * that we need to pass in functions as arguments to a
 * graphing function... I guess.
 *
 */

// 1. Make a graph object
// 2. Set properties about the graph object
// 3. Draw the graph object.
// This will allow us to "re-draw" the object more easily, I think.

// About the data function...
// 1. Should just generate a hunk of data. [{x: int, y: int}, ...]
// 2. Keep this hunk of data inside the graph object
// 3. Use the bounds from the dataset for the scale arguments of the graph.
//
import * as d3 from 'd3';

/**
 * Some more thoughts;
 * I want the option to graph both absolute and relative resistance
 * over the note frequency. The idea here is that depending on the
 * resistance of voltage divider, we can get a better idea about how
 * that frequency is affected while seeing the absolute resistance may
 * not be as clear.
 *
 */


/**
 * BUGS
 * - Decimal values don't work. E.g. 4.7u
 */


/**
 * Helper Functions - EE
 */

export function expandMetricPrefix(value) {
    /* Handles; 100K, 324M, 1.2u, etc... */
    // https://en.wikipedia.org/wiki/Metric_prefix
    const METRIC_PREFIXES = {
        M: Math.pow(10, 6),
        k: Math.pow(10, 3),
        m: Math.pow(10, -3),
        u: Math.pow(10, -6),
        n: Math.pow(10, -9),
        p: Math.pow(10, -12)
    }
    // This should probably be external to funcion.
    // Probably need another function which takes a non-prefixed
    // number and makes it into a prefixed number.

    let index = value.length;
    let lastChar = value.substring(index - 1)
    let multiple = 1;
    let v = 0;

    if (isNaN(parseInt(lastChar))) {
        if (!(lastChar in METRIC_PREFIXES)) {
            throw new InputError("Unknown prefix: " + lastChar);
        }
        multiple = METRIC_PREFIXES[lastChar];
        index -= 1;
    }

    v = value.substring(0, index);
    if (isNaN(Number(v))) {
        throw new InputError("Unknown number: " + v);
    }
    
    return Number(v) * multiple;
}

export function capReactance(farads, frequency) {
    return 1 / (2 * Math.PI * farads * frequency);
}

// TODO: Change to metric prefix conversion.
export function resistanceLabel(ohms) {
    let symbol = ""
    let unit = Math.floor((String(ohms).length - 1) / 3);

    if (unit >= 2) { symbol = "M"; } 
    else if (unit === 1) { symbol = "K"; }
    
    let value = ohms / Math.pow(10, ((unit * 3) - 1));
    value = Math.round(value) / 10;

    return String(value) + symbol;
}

export function precision(value, places) {
    let proddiv = Math.pow(10, places);
    return Math.round(value * proddiv) / proddiv;
}

/**
 * Helper Functions - MUSIC
 */

// XXX: Is there a good reason for these to be generators
// and not functions which just return the data?

export function * genMusicalNotes() {
    // Generates all the note names and frequencies on the piano
    const startFreq = 27.5;     // Frequency of A0;
    const TR2 = 1.05946309436;  // 12th root of 2
    const numNotes = 88;
    const noteNames = [
        "A", "A#/Bb", "B", "C",
        "C#/Db", "D", "D#/Eb", "E",
        "F", "F#/Gb", "G", "G#/Ab"
    ];

    let freq = startFreq;
    let octave = 0;

    for (let nn = 1; nn <= numNotes; nn++) {
        yield {
            name: noteNames[(nn - 1) % 12].concat(octave),
            freq: precision(freq, 2)
        };

        // There are only 3 notes in octave 0. 9 = 12 - 3
        if ((nn + 9) % 12 === 0) octave++;
        if (nn % 12 === 0) {
            freq = Math.pow(2, (nn / 12)) * startFreq;
        } else {
            freq = freq * TR2;
        }
    }
}

export function * genAENotes() {
    // NOTE: The low E on the guitar starts at E2.
    for (const note of getNotes()) {
        // A0, E1, A1, etc...
        if (note.name.length > 2) continue;
        if (note.name.startsWith("A") || note.name.startsWith("E")) {
            yield note;
        }
    }
}

var MUSIC_NOTES = [];
export function getNotes() {
    if (MUSIC_NOTES.length === 0) {
        for (const note of genMusicalNotes()) {
            MUSIC_NOTES.push(note);
        }
    }
    return MUSIC_NOTES;
}

export function logNotes(noteFunc) {
    for (const note of noteFunc()) {
        console.log(note.name + "\t" + note.freq);
    }
}


/**
 * Graph Data Functions.
 *
 * These should produce: [{x: ?, y: ?}, ...] data.
 *
 */

function InputError(message) {
    this.message = message;
    console.error("ERR: " + message);
}

export function getFilterDecibelFunc(type, res, cap) {
    if (type !== "RC" && type !== "CR") {
        throw new InputError("Unknown filter type");
    }
    let resVal = expandMetricPrefix(res);
    let capVal = expandMetricPrefix(cap);

    return function(freq) {
        let capReact = capReactance(capVal, freq);
        let numerator = resVal;
        if (type === "CR") numerator = capReact;

        let voltDiv = numerator / (resVal + capReact);
        let decibel = 10 * Math.log10(voltDiv);

        return precision(decibel, 2);
    }
}

// I feel like this could be more generic.
// There is a subtlety here of making the frequency the X
// data and running the function on X for the Y data.
// ... I will leave this for now.
export function getDataNotes(noteGen, efOfX) {
    let data = [];
    for (const item of noteGen()) {
        data.push({
            x: item.freq,
            y: efOfX(item.freq),
            xLabel: item.name
        });
    }
    return data;
}

/**
 * Graphs
 */

export function FilterDecibelNotesGraph(height, width, data) {
    /**
     * Graph the decibel effect of a filter on musical notes.
     *
     * Data should be [{x: freq, y: decibel, xLabel: noteName}, ... ]
     *
     * Think about making grey grid lines on graph.
     * Maybe some mouse over items and distinguish the -3dB point?
     *
     */

    // XXX: Define const's somewhere else?
    const minHeight = 200;
    const minWidth = 300;
    const margin = {top: 20, right: 20, bottom: 20, left: 40};

    // check args:
    if (height < minHeight || width < minWidth) {
        throw new InputError(
            "minimum height and width are: " + minHeight + "x" + minHeight);
    }

    // The note frequency is a binary logarithm scale.
    let xScale = d3.scaleLog().base(2)
        .domain(d3.extent(data, function(d) {return d.x}))
        .range([margin.left, width - margin.right]);

    // The Y axis is given as the decibel value which is already a common log
    // we need to keep the scale as linear. I think ... 
    let yScale = d3.scaleLinear()
        .domain([-12, 0]) //d3.extent(data, function(d) {return d.y}))
        .range([height - margin.top, margin.top]);
    // Also, we need to decide what an appropriate range is ...
    // At some point in the future, I will likely have data which shows
    // an active filter that results in a dBv gain.

    // set x and y values for line generator
    let line = d3.line()
        .x(function(item, incr) { return xScale(item.x); })
        .y(function(item, incr) { return yScale(item.y); })
        .curve(d3.curveMonotoneX)
    
    let svg = d3.create("svg");

    svg.attr("width", width)
        .attr("height", height)
        .append("g");

    // XXX Need to add labels for both Axis.

    var tooltip = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);

    // X Axis - Note frequency and Note Name
    let xVals = [];
    data.forEach(item => xVals.push(item.x));

    let getXLabel = (d, i) => data[i].xLabel; 
    var xAxis = d3.axisBottom()
        .scale(xScale)
        .tickValues(xVals)
        .tickSize(5)
        .tickFormat(getXLabel);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")")
        .call(xAxis); // XXX XXX XXX Change to `height - margin.bottom`

    // Y Axis - Voltage Change in dB
    let yVals = [];
    data.forEach(item => yVals.push(item.y));

    let getYLabel = (d, i) => String(d).concat("dB");

    let yAxis = d3.axisLeft()
        .scale(yScale)
        .tickSize(5)
        .tickFormat(getYLabel);

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(yAxis);


    // 9. Append the path, bind the data, and call the line generator 
    svg.append("path")
        .datum(data) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", line); // 11. Calls the line generator 

    let dotSize = [4, 8];

    // This looks gross and weird.
    // I am not sure exactly what I want yet.
    //
    // More ideas; make a circle inside of a circle in order
    // to increase the mouse over area of each point.
    // Or, think about making verticle bars which, when mouse
    // over happens, they show the hint for a particular note.
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle") // Uses the enter().append() method
        // Storing data here. Not sure this is the best?
        .attr("note", (d, i) => getXLabel(d, i))
        .attr("freq", (d, i) => d.x)
        .attr("db", (d, i) => getYLabel(d.y, i))
        // Display elements.
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", (d, i) => xScale(d.x))
        .attr("cy", (d, i) => yScale(d.y))
        .attr("r", dotSize[0])
        .on("mouseover", function(a) { 
            console.log(
                this.getAttribute("note") + "(" +
                this.getAttribute("freq") + "Hz) " +
                this.getAttribute("db") + ""
            );
            this.setAttribute("r", dotSize[1]);

            let comment = this.getAttribute("note") + "(" +
                this.getAttribute("freq") + "Hz) " +
                this.getAttribute("db") + ""
            tooltip.transition().duration(200).style("opacity", .9);      
            tooltip.html(comment)
                .style("left", (d3.select(this).attr("cx") + 20) + "px")
                .style("top", (d3.select(this).attr("cy") - 20) + "px");
        })
        .on("mouseout", function() {  
            tooltip.transition().duration(200).style("opacity", 0);
            this.setAttribute("r", dotSize[0]);
        });

    // So, .node() return the actual DOM node instead of the D3 representation.
    return svg;
}


