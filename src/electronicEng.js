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


// There are possibly better structs to use here.
const METRIC_PREFIX_2_EXPONENT = {
    "Y": 24,
    "Z": 21,
    "E": 18,
    "P": 15,
    "T": 12,
    "G": 9,
    "M": 6,
    "k": 3,
    "": 0,
    "m": -3,
    "u": -6,
    "n": -9,
    "p": -12,
    "f": -15,
    "a": -18,
    "z": -21,
    "y": -24
};

let _metric_exponent_2_prefix = {};
for (const [prefix, exponent] of Object.entries(METRIC_PREFIX_2_EXPONENT)) {
    _metric_exponent_2_prefix[exponent] = prefix;
}
const METRIC_EXPONENT_2_PREFIX = _metric_exponent_2_prefix;

let _metric_max_exponent = Number.MIN_VALUE;
let _metric_min_exponent = Number.MAX_VALUE;
for (const exponent of Object.values(METRIC_PREFIX_2_EXPONENT)) {
    if (exponent > _metric_max_exponent) _metric_max_exponent = exponent;
    if (exponent < _metric_min_exponent) _metric_min_exponent = exponent;
}
const METRIC_MAX_EXPONENT = _metric_max_exponent;
const METRIC_MIN_EXPONENT = _metric_min_exponent;


/**
 * Helper Functions - EE
 */

export function expandMetricPrefix(value) {
    /* Handles; 100K, 324M, 1.2u, etc... */
    // https://en.wikipedia.org/wiki/Metric_prefix

    let index = value.length;
    let lastChar = value.substring(index - 1)
    let multiple = 1;
    let v = 0;

    if (isNaN(parseInt(lastChar))) {
        if (!(lastChar in METRIC_PREFIX_2_EXPONENT)) {
            throw new InputError("Unknown prefix: ".concat(lastChar));
        }
        multiple = Math.pow(10, METRIC_PREFIX_2_EXPONENT[lastChar]);
        index -= 1;
    }

    v = value.substring(0, index);
    if (isNaN(Number(v))) {
        throw new InputError("Unknown number: " + v);
    }
    
    return Number(v) * multiple;
}

export function addMetricPrefix(value) {
    const step = 3; // Could be METRIC_STEP global.
    let exponent = 0;

    if(isNaN(Number(value))) {
        throw new InputError("Unknown number: ".concat(value));
    }

    if (value === 0) {
        return value;
    } else if (value < 1) {
        while (value < 1 && exponent > METRIC_MIN_EXPONENT) {
            exponent -= step;
            value *= Math.pow(10, step);
        }
    } else if (value >= Math.pow(10, step)) { // XXX test this.
        while (value >= Math.pow(10, step) && exponent < METRIC_MAX_EXPONENT) {
            exponent += step;
            value /= Math.pow(10, step);
        }
    }
    let number_str = String(precision(value, 2));
    return number_str.concat(METRIC_EXPONENT_2_PREFIX[exponent]);
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

