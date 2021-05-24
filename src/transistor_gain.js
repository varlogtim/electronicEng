import React from 'react';
import * as EE from './electronicEng.js';
import PNPDiagram from './images/pnp-gain-calculator.svg'
import WarningTriangle from './images/warning_triangle.svg'


/**
 * Notes and TODO things:
 *  - There is a max hFE that a given set of resistors can calculate
 *    I should probably calculate this and inform.
 *  - ^ this can be gathered by determining transistor saturation.
 *
 */

let UNKNOWN = "?";

function calculateCurrent(resistor_val, voltage_val) {
    try {
        // XXX expand needs to error on "1.k" stuff, or does it?
        let resistance = EE.expandMetricPrefix(resistor_val);
        let voltage = EE.expandMetricPrefix(voltage_val);
        // XXX Need an addMetricPrefix();
        return EE.addMetricPrefix(voltage / resistance);
    } catch {
        return UNKNOWN;
    }
}

function calculateHfe(base_current, leakage_current, collector_current) {
    console.log("calculateHfe!!");
    try {
        let collector = EE.expandMetricPrefix(collector_current);
        let leakage = EE.expandMetricPrefix(leakage_current);
        let base = EE.expandMetricPrefix(base_current);
        
        let result = (collector - leakage) / base;

        return EE.precision(result, 2);
    } catch (err) {
        console.log("HFE ERROR: " + err);
        return UNKNOWN;
    }
}

export class PNPTransistorGainCalculator extends React.Component {
    constructor(props) {
        super(props);

        // XXX I really dislike maintaining error state this way.
        this.state = {
            // User inputs:
            resistance_base: "1M",      rb_error: false,
            resistance_collector: "10k",rc_error: false,
            voltage_base: "",           vb_error: true,
            voltage_collector_off: "",  vcoff_error: true,
            voltage_collector_on: "",   vcon_error: true,
            // Calculated values:
            base_current: UNKNOWN,
            leakage_current: UNKNOWN,
            collector_current: UNKNOWN,
            hfe: UNKNOWN
        };
    }

    handleValueChange(e) {
        let state = this.state;
        state[e.target.name] = e.target.value;
        try {
            EE.expandMetricPrefix(e.target.value);
            state[e.target.getAttribute("error_name")] = false;
        } catch (err) {
            state[e.target.getAttribute("error_name")] = true;
        }
        // for (const [key, value] of Object.entries(state)) {
        //     console.log(key + ": " + value);
        // }
        state.base_current = calculateCurrent(
            state.resistance_base, state.voltage_base);
        state.leakage_current = calculateCurrent(
            state.resistance_collector, state.voltage_collector_off);
        state.collector_current = calculateCurrent(
            state.resistance_collector, state.voltage_collector_on);
        state.hfe = calculateHfe(
            state.base_current,
            state.leakage_current,
            state.collector_current);
        this.setState(state);
    }

    render() {return(
        <div className="transistor_gain_calc flex justify-start bg-white border">
            <div className="diagram block p-2 pt-7 w-5/12">
                <img src={PNPDiagram} alt="PNP Transistor Gain Diagram" />
            </div>
            <div className="block p-2 w-7/12">

                <div className="step_container">
                    <div className="">
                        {/* Make steps a Tailwind class */}
                        <span className="block p-1 w-12/12 text-lg">
                            <b>Step 1.</b> Specify your resistor values:
                        </span>
                    </div>

                    <div className="flex">
                        <div className="flex p-2 w-6/12">
                            <span className="p-1 text-2xl">R<sub>b</sub></span>
                            <input className="textfield text-2xl"
                                type="text" value={this.state.resistance_base}
                                name="resistance_base" error_name="rb_error"
                                onChange={e => this.handleValueChange(e)}/>
                            <span className="text-2xl label pl-1">&#8486;</span>
                            <img alt="Please specify a correct value"
                                className={`p-1 h-8 ${
                                    this.state.rb_error ? "visible" : "invisible"}`}
                                src={WarningTriangle} />
                        </div>
                        <div className="p-2 w-6/12 flex">
                            <span className="p-1 text-2xl">R<sub>c</sub></span>
                            <input className="textfield text-2xl"
                                type="text" value={this.state.resistance_collector}
                                name="resistance_collector" error_name="rc_error"
                                onChange={e => this.handleValueChange(e)}/>
                            <span className="pl-1 text-2xl label">&#8486;</span>
                            <img alt="Please specify a correct value"
                                className={`p-1 h-8 ${
                                    this.state.rc_error ? "visible" : "invisible"}`}
                                src={WarningTriangle} />
                        </div>
                    </div>
                </div>

                <div className="step_container">
                    <div className="flex">
                        <span className="p-1 w-12/12 text-lg">
                            <b>Step 2.</b> Activate switch. Measure voltage across R<sub>b</sub>:
                        </span>
                    </div>
                    <div className="flex">
                        <div className="flex p-2 w-6/12">
                            <span className="p-1 text-2xl">
                                V<sub>b</sub></span>
                            <input className="textfield text-2xl"
                                type="text" value={this.state.voltage_base}
                                name="voltage_base" error_name="vb_error"
                                onChange={e => this.handleValueChange(e)}/>
                            <span className="text-2xl label pl-1">V</span>
                            <img alt="Please specify a correct value"
                                className={`p-1 h-8 ${
                                    this.state.vb_error ? "visible" : "invisible"}`}
                                src={WarningTriangle} />
                        </div>
                        <div className="block flex justify-start p-2 w-6/12">
                            <span className="text-2xl w-5/12">I<sub>base</sub></span>
                            <span className="text-2xl w-7/12">
                                {this.state.base_current}A
                            </span>
                        </div>
                    </div>
                </div>

                <div className="step_container">
                    <div className="flex">
                        <span className="p-1 w-12/12 text-lg">
                            <b>Step 3.</b> Deactivate switch. Measure voltage across R<sub>c</sub>
                        </span>
                    </div>
                    <div className="flex">
                        <div className="flex p-2 w-6/12">
                            <span className="p-1 text-2xl">
                                V<sub>c</sub></span>
                            <input className="textfield text-2xl"
                                type="text" value={this.state.voltage_collector_off}
                                name="voltage_collector_off" error_name="vcoff_error"
                                onChange={e => this.handleValueChange(e)}/>
                            <span className="label text-2xl pl-1">V</span>
                            <img alt="Please specify a correct value"
                                className={`p-1 h-8 ${
                                    this.state.vcoff_error ? "visible" : "invisible"}`}
                                src={WarningTriangle} />
                        </div>
                        <div className="flex p-2 w-6/12">
                            <span className="text-2xl w-5/12">I<sub>leakage</sub></span>
                            <span className="text-2xl w-7/12">
                                {this.state.leakage_current}A
                            </span>
                        </div>
                    </div>
                </div>

                <div className="step_container">
                    <div className="flex">
                        <span className="p-1 w-12/12 text-lg">
                            <b>Step 4.</b> Activate switch. Measure voltage across R<sub>c</sub>
                        </span>
                    </div>
                    <div className="flex">
                        <div className="flex p-2 w-6/12">
                            <span className="p-1 text-2xl">
                                V<sub>c</sub></span>
                            <input className="textfield text-2xl"
                                type="text" value={this.state.voltage_collector_on}
                                name="voltage_collector_on" error_name="vcon_error"
                                onChange={e => this.handleValueChange(e)}/>
                            <span className="label text-2xl pl-1">V</span>
                            <img alt="Please specify a correct value"
                                className={`p-1 h-8 ${
                                    this.state.vcon_error ? "visible" : "invisible"}`}
                                src={WarningTriangle} />
                        </div>
                        <div className="flex p-2 w-6/12">
                            <span className="text-2xl w-5/12">I<sub>collector</sub></span>
                            <span className="text-2xl w-7/12">
                                {this.state.collector_current}A
                            </span>
                        </div>
                    </div>
                </div>

                <div className="step_container">
                    <div className="flex justify-start text-4xl">
                        <span className="block p-4 w-2/12">
                            h<sub>FE</sub>
                        </span>
                        <span className="block p-4 w-4/12">
                            {this.state.hfe}x
                        </span>
                        <span className="block p-4 w-2/12">
                            @
                        </span>
                        <span className="block p-4 w-4/12">
                            {this.state.base_current}A
                        </span>
                    </div>
                    <div className="flex">
                        <span className="p-1 w-12/12 text-lg">
                            <b>Step 5.</b> Replace with next transistor and goto Step 3.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )}
}
