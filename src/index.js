import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as FilterGraphs from './filter_graph.js';


class PageBase extends React.Component {
    render() {
        return (
            <div className="w-9/12 bg-white">
                <div className="w-100 bg-gray-500 h-16 shadow-xl p-4">
                    <div>Menu</div>
                </div>
                <FilterGraphs.DecibelFilterGraphControlPanel 
                    type="RC"
                    farads="100n"
                    ohms="100k"
                    width={900}
                    height={300} 
                />
            </div>
        );
    }
}


ReactDOM.render(
    <PageBase />,
    document.querySelector('#root')
);




