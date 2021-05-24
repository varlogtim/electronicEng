import React from 'react';
// import * as d3 from 'd3';

// XXX reportedly React recomends against inheritance ... but ...
// Well, why is this a class? Only really to set default prop
// ... and also for name sake.
//
// Spoke to Darrin, he suggested that these not be React components.
// Intuitively this seems correct. I just need to see if that
// complicates things further. XXX Look into this later.
//
class ElectricalComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            voltage_source: false
            // XXX current_source?
        }
    }

}

export class GND extends ElectricalComponent {
    constructor(props) {
        super(props);

        this.state = {
            voltage_source: true,
            voltage: 0
        }
    }
}

export class DCPowerSource extends ElectricalComponent {
    constructor(props) {
        super(props);

        // this is incomplete.
        this.state = {
            voltage_source: true,
            voltage: props.voltage
        }
    }
    
}

export class Resistor extends ElectricalComponent {
    constructor(props) {
        super(props);

        this.state = {
            resistance: props.resistance,
            voltage: 0,
            current: 0
        }
    }
}

export class CircuitGraph extends React.Component {
    constructor(props) {
        super(props);

        /**
         *           Graph for Circuits
         *
         * V+
         * ^         vertices: [ V+, R1, R2, R3, GND ] 
         * │
         * ├───┐     edges: [
         * │   │        [ X, 1, 1, 0, 0 ],
         * │   R2       [ 0, X, 0, 0, 1 ],
         * R1  │        [ 0, 0, X, 1, 0 ],
         * │   R3       [ 0, 0, 0, X, 1 ],
         * │   │        [ 0, 0, 0, 0, X ]]
         * ├───┘     
         * │         edges[IN][OUT]
         * │         
         * GND       paths: [
         *              [0, 1, 4],
         *              [0, 2, 3, 4]]
         *
         * Notes:
         *  - I am not sure how to handle transistors yet.
         *  - A transistor is a component with two nodes in one?
         *  - Also, diodes ... I might need a voltage and current solver?
         *  - https://www.khanacademy.org/science/electrical-engineering/ee-circuit-analysis-topic/ee-dc-circuit-analysis/a/ee-superposition
         *  ^ this is a good read
         */

        this.state = {
            vertices: [],
            edges: []
        }
        // might want to cache paths and update?
        //
        // So... Need types called, VoltageSource? Is gnd a source?
    }

    // Need to find all paths between voltage sources.
    // Not sure how to handle multiple power sources yet.
    // Also, not sure about current sources.

    findAllPaths() {
        /** Depth first serach.
         * 1. Find voltage source vertices
         * 2. Walk through edge outs, i.e., edges[vertex][0..len]
         * 3. On each connection, decent into out.
         */
        let paths = [];  // [[vertex_index, ...], ... ]

    }
}




export class GermaniumTransistorHfeCalc extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            type: "PNP",    // Support NPN later.
            rc: props.rc,   // resistance collector
            rb: props.rb,   // resistance base
            vb: 0,          // voltage across base resistor
            vc_off: 0,      // voltage across collector resistor - base (OFF)
            vc_on: 0,       // voltage across collector resistor - base (ON)
            ileak: 0,       // leakage current
            ic: 0,          // current through collector
            ib: 0           // current through base
        };
        // Might have an issue as a user state update causes
        // another state update. e.g., voltage update causes current update.
        //
        // Hrm...
        //
        // Maybe I need a "resistor" component and a "transistor" component.
        // ... because ... the state change affects the component.
        // Damn, actually, this could be a graph problem.
        // Hrmm...
        // 
        // Yeah, so, I am thinking that I could make each electrical
        // component a react component and represent the relationship
        // as a Graph.
        //
        // ^ Ok, thought about this and this is the plan.
        //
        // Actually, I thought about this more and I think I need
        // depth search until I get to a static voltage point,
        // i.e., ground or power source.


        
    }

}
