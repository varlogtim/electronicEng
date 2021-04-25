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
            name: noteNames[(nn - 1) % 12] + String(octave),
            freq: Math.floor(freq * 100) / 100
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
 * Generators
 */

function * genNotesCapReact(noteGen, farads) {
    for (const note of noteGen()) {
        yield {
            name: note.name,
            freq: note.freq,
            cr: Math.round(capReactance(farads, note.freq))};
    }
}

// genData* funcs should make graphable data..


function genDataCapReactNotes(noteGen, farads) {
    /* Generate data for capacitive reactance across note values */
    let data = [];
    let capVal = expandMetricPrefix(farads);
    let gen = genNotesCapReact(noteGen, capVal);
    for (const item of gen) {
        data.push({
            x: item.freq,
            y: item.cr,
            xLabel: item.name,
        });
    }
    return data;
}


function genDataRCNotes(noteGen, ohms, farads) {
    /**
     * Generate data for an RC filter. 
     * Make Y axis data a percentage of voltage.
     */
    let data = [];
    let capVal = expandMetricPrefix(farads);
    let resVal = expandMetricPrefix(ohms);
    let gen = genNotesCapReact(noteGen, capVal);
    for (const item of gen) {
        let percent = Math.round((resVal * 10000) / (resVal + item.cr)) / 100
        let decibel = 10 * Math.log10(resVal / (resVal + item.cr));
        data.push({
            x: item.freq,
            y: decibel,
            xLabel: item.name
        });
    }
    return data;
}


function genDataCRNotes(noteGen, farads, ohms) {
    /**
     * Generate data for an CR filter.
     * Make Y axis data a percentage of voltage.
     */
    let data = [];
    let resVal = expandMetricPrefix(ohms);
    let capVal = expandMetricPrefix(farads);
    let gen = genNotesCapReact(noteGen, capVal);
    for (const note of gen) {
        let decibel = 10 * Math.log10(note.cr / (note.cr + resVal));
        data.push({
            x: note.freq,
            y: decibel,
            xLabel: note.name
        });
    }
    return data;
}

// NOTE: The low E on the guitar starts at E2.

function NotesGraph(height, width, data) {
    /**
     * So, this is going to be a graph for notes...
     * After thinking about this more ... it looks like
     * we need to measure the dBv of the filter. I guess.
     *
     * This means that we need to change the name of this
     * function.
     */
    const minHeight = 200;
    const minWidth = 300;
    const margin = {top: 20, right: 20, bottom: 20, left: 40};

    // check args:
    if (height < minHeight || width < minWidth) {
        throw "minimum height and width are: " + minHeight + "x" + minHeight;
    }
    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;

    let xScale = d3.scaleLog()
        .domain(d3.extent(data, function(d) {return d.x}))
        .range([margin.left, width - margin.right]);

    // yScale should be DB, of voltage.
    let yScale = d3.scaleLinear()
        .domain([-12, 0]) //d3.extent(data, function(d) {return d.y}))
        .range([height - margin.top, margin.top]);

    // set x and y values for line generator
    let line = d3.line()
        .x(function(item, incr) { return xScale(item.x); })
        .y(function(item) { return yScale(item.y); })
        .curve(d3.curveMonotoneX)
    
    let svg = d3.create("svg");

    svg.attr("width", width)
        .attr("height", height)
        .append("g");

    // NOTE TO SELF: these structures are weird.
    // I need to think about what we really want
    // the data to require.
    //
    // In reality, what I need is an implementation of a
    // generator which produces lists of specific structs.
    // Not sure how to do this in JavaScript though.

    // X Axis 
    let xVals = [];
    data.forEach(item => xVals.push(item.x));

    xTickFormat = function(x, i) {
        if ('xLabel' in data[i]) {
            return data[i].xLabel;
        } else {
            return data[i].x;
        }
    };
    var xAxis = d3.axisBottom()
        .scale(xScale)
        .tickValues(xVals)
        .tickSize(5)
        .tickFormat(xTickFormat);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (innerHeight + margin.top) + ")")
        .call(xAxis);

    // Y Axis
    let yVals = [];
    data.forEach(item => yVals.push(item.y));

    let yAxis = d3.axisLeft()
        .scale(yScale)
        .tickSize(5)
        .tickFormat(function(x, i) {
            return x; //resistanceLabel(x);
        });

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(yAxis);
    // Create an axis component with d3.axisLeft

    // 9. Append the path, bind the data, and call the line generator 
    svg.append("path")
        .datum(data) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", line); // 11. Calls the line generator 

    // 12. Appends a circle for each datapoint 
    // svg.selectAll(".dot")
    //     .data(data)
    //   .enter().append("circle") // Uses the enter().append() method
    //     .attr("class", "dot") // Assign a class for styling
    //     .attr("cx", function(d, i) { return xScale(d.x) })
    //     .attr("cy", function(d) { return yScale(d.y) })
    //     .attr("r", 5)
    //       .on("mouseover", function(a, b, c) { 
    //             console.log(a) 
    //         this.attr('class', 'focus')
    //         })
    //       .on("mouseout", function() {  });

    // So, .node() return the actual DOM node instead of the D3 representation.
    return svg;
}


