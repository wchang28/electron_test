import {remote} from 'electron';
import * as g from './content';
import * as path from 'path';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

let x = remote.require('./main');
let test = x.Test;
test((err:any, ret:any) => {
    if (err)
        alert(JSON.stringify(err));
    else
        alert(JSON.stringify(ret));
});

//let greeting = new g.Greeting();
//greeting.sayHi();

interface ITestAppProps {
}

interface ITestAppState {
}

class TestApp extends React.Component<ITestAppProps, ITestAppState> {
    constructor(props:ITestAppProps) {
        super(props);
        //this.state = {contentType: appContent.ContentType.Home, conn_id: null};
    }
    render() {
        //let es = global['EventSource'];
        let s = path.join(__dirname, 'xxxyyy.jpg');
        //let s = es.toString();
        return (
            <div>
                <div className="w3-container w3-margin-bottom w3-green">
                    <p>{s}</p>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<TestApp />, document.getElementById('main'));

//let s = path.join(__dirname, '../js/content')
//alert(s);