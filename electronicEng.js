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

function * getAENotes() {
    for (const note of getNotes()) {
        // A0, E1, A1, etc...
        if (note.name.length > 2) continue;
        if (note.name.startsWith("A") || note.name.startsWith("E")) {
            yield note;
        }
    }
}

function parseCapacitorValue(value) {
    const symbolDivisor = {
        f: 1,
        m: 1000,
        u: 1000000,
        n: 1000000000,
        p: 1000000000000};

    let farads = 0;
    let divisor = 0;
    let index = value.length;
    let digit = 0;
    while(index--) {
        if (divisor == 0) {
            divisor = symbolDivisor[value[index]];
            continue;
        }
        farads += value[index] * Math.pow(10, digit++);
    }
    return farads / divisor;
}

function capReactance(farads, frequency) {
    return 1 / (2 * Math.PI * farads * frequency);
}

function * genNotesCapReact(noteGen, farads) {
    for (const note of noteGen()) {
        console.log(
            "Name: " + note.name + ", freq: " + note.freq + 
            " cap: " + capReactance(farads, note.freq));
        yield {
            name: note.name,
            freq: note.freq,
            cr: Math.round(capReactance(farads, note.freq))};
    }
}

function testData() {
    let data = [];
    for (const item of genNotesCapReact(getAENotes, parseCapacitorValue("1000n"))) {
        data.push({
            x: item.freq,
            y: item.cr,
            xLabel: item.name,
            yLabel: item.cr
        });
    }
    return data;
}

function resistanceLabel(ohms) {
    let symbol = ""
    let unit = Math.floor((String(ohms).length - 1) / 3);

    if (unit >= 2) { symbol = "M"; } 
    else if (unit == 1) { symbol = "K"; }
    
    let value = ohms / Math.pow(10, ((unit * 3) - 1));
    value = Math.round(value) / 10;

    return String(value) + symbol;

}

function GGraph(height, width, xScale, yScale, data) {
    // So ... there is a one to one relationship between the
    // data and the graph. We could redraw the graph for height
    // and width changes, but if the data changes, we need a new graph.
    const minHeight = 200;
    const minWidth = 300;
    const margin = {top: 20, right: 20, bottom: 20, left: 40};

    // check args:
    if (height < minHeight || width < minWidth) {
        throw "minimum height and width are: " + minHeight + "x" + minHeight;
    }
    this.width = width;
    this.height = height;
    this.innerWidth = width - margin.left - margin.right;
    this.innerHeight = height - margin.top - margin.bottom;

    // !! TODO Validate data is list with {x: ??, y: ??}
    this.data = data;

    let extent = d3.extent(data);

    if (typeof xScale !== 'function' || typeof yScale !== 'function') {
        // instanceof d3.scaleLinear(), d3.scaleLog, etc...
        throw "x/yScale args must be d3.scale*() returns";
    }

    // .domain(d3.extent(data[]))
    this.xScale = xScale
        .domain(d3.extent(data, function(d) {return d.x}))
        .range([margin.left, width - margin.right]);


    this.yScale = yScale
        .domain(d3.extent(data, function(d) {return d.y}))
        .range([height - margin.top, margin.top]);

    // set x and y values for line generator
    var line = d3.line()
        .x(function(data, incr) { 
            console.log("in X, incr: " + incr + ", data.x: " + data.x);
            // return xScale(incr);
            // return data.x
            return this.xScale(data.x);
        })
        .y(function(data) {
            return this.yScale(data.y); 
        })
        .curve(d3.curveMonotoneX)
    
    var svg = d3.create("svg");
    svg.attr("width", width)
        .attr("height", height)
        .append("g");

    // X Axis 
    let xVals = [];
    data.forEach(item => xVals.push(item.x));

    var xAxis = d3.axisBottom()
        .scale(this.xScale)
        .tickValues(xVals)
        .tickSize(6)
        .tickFormat(function(x, i) {
            console.log("tickFormat: x: " + x + ", i: " + i);
            return data[i].xLabel;
        });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (innerHeight + margin.top) + ")")
        .call(xAxis);

    // Y Axis
    let yVals = [];
    data.forEach(item => yVals.push(item.y));

    let yAxis = d3.axisLeft()
        .scale(this.yScale)
        // .tickValues(yVals)
        .tickSize(5)
        .tickFormat(function(x, i) {
            console.log("yTickForm: " + x + ", i: " + i);
            return resistanceLabel(x);
        });

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(yAxis);
    // Create an axis component with d3.axisLeft

    // 9. Append the path, bind the data, and call the line generator 
    svg.append("path")
        .datum(this.data) // 10. Binds data to the line 
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

function test() {
    alert("This is a test");   
}
