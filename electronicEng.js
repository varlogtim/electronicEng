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

/**
 * Some more thoughts;
 * I want the option to graph both absolute and relative resistance
 * over the note frequency. The idea here is that depending on the
 * resistance of voltage divider, we can get a better idea about how
 * that frequency is affected while seeing the absolute resistance may
 * not be as clear.
 */


/**
 * Helper Functions - EE
 */

function expandMetricPrefix(value) {
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

    let multiple = 0;
    let digit = 0;
    let index = value.length;
    let v = 0;

    while(index--) {
        // This looks janky... fix it.
        if (multiple == 0) {
            if (!isNaN(parseInt(value[index]))) {
                multiple = 1;
            } else {
                if (value[index] in METRIC_PREFIXES) {
                    multiple = METRIC_PREFIXES[value[index]];
                    continue;
                }
                throw "Unknown prefix: " + value[index];
            }
        }
        v += Number(value[index]) * Math.pow(10, digit++);
    }
    return v * multiple;
}

function capReactance(farads, frequency) {
    return 1 / (2 * Math.PI * farads * frequency);
}

// TODO: Change to metric prefix conversion.
function resistanceLabel(ohms) {
    let symbol = ""
    let unit = Math.floor((String(ohms).length - 1) / 3);

    if (unit >= 2) { symbol = "M"; } 
    else if (unit == 1) { symbol = "K"; }
    
    let value = ohms / Math.pow(10, ((unit * 3) - 1));
    value = Math.round(value) / 10;

    return String(value) + symbol;
}

function precision(value, places) {
    let proddiv = Math.pow(10, places);
    return Math.round(value * proddiv) / proddiv;
}

/**
 * Helper Functions - MUSIC
 */

function * genMusicalNotes() {
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
        if ((nn + 9) % 12 == 0) octave++;
        if (nn % 12 == 0) {
            freq = Math.pow(2, (nn / 12)) * startFreq;
        } else {
            freq = freq * TR2;
        }
    }
}

function * genAENotes() {
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
function getNotes() {
    if (MUSIC_NOTES.length == 0) {
        for (const note of genMusicalNotes()) {
            MUSIC_NOTES.push(note);
        }
    }
    return MUSIC_NOTES;
}

function logNotes(noteFunc) {
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

function getFilterDecibelFunc(type, res, cap) {
    if (type != "RC" && type != "CR") {
        throw "Unknown filter type";
    }
    let resVal = expandMetricPrefix(res);
    let capVal = expandMetricPrefix(cap);

    return function(freq) {
        let capReact = capReactance(capVal, freq);
        let numerator = resVal;
        if (type == "CR") numerator = capReact;

        let voltDiv = numerator / (resVal + capReact);
        let decibel = 10 * Math.log10(voltDiv);

        return precision(decibel, 2);
    }
}

// I feel like this could be more generic.
// There is a subtlety here of making the frequency the X
// data and running the function on X for the Y data.
// ... I will leave this for now.
function getDataNotes(noteGen, efOfX) {
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

function FilterDecibelNotesGraph(height, width, data) {
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
        throw "minimum height and width are: " + minHeight + "x" + minHeight;
    }
    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;

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
        .attr("transform", "translate(0," + (innerHeight + margin.top) + ")")
        .call(xAxis);

    var tooltip = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);

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

    // 12. Appends a circle for each datapoint 
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
        .attr("r", 4)
        .on("mouseover", function(a) { 
            // This looks gross and weird.
            // I am not sure exactly what I want yet.
            console.log(
                this.getAttribute("note") + "(" +
                this.getAttribute("freq") + "Hz) " +
                this.getAttribute("db") + ""
            );
            this.setAttribute("r", 6);

            let comment = this.getAttribute("note") + "(" +
                this.getAttribute("freq") + "Hz) " +
                this.getAttribute("db") + ""
            tooltip.transition().duration(200).style("opacity", .9);      
            tooltip.html(comment)  
                .style("left", d3.select(this).attr("cx") + "px")
                .style("top", d3.select(this).attr("cy") + "px");
        })
        .on("mouseout", function() {  
            tooltip.transition().duration(200).style("opacity", 0);
            this.setAttribute("r", 4);
            // this.querySelector(".tooltiptext").remove();
        });

    // So, .node() return the actual DOM node instead of the D3 representation.
    return svg;
}


