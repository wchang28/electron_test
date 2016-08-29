import * as rcf from 'rcf';
import * as $node from 'rest-node';
import * as FormData from 'form-data';
import * as fs from 'fs';

let connectOptions: rcf.ApiInstanceConnectOptions = {
	"instance_url": "http://127.0.0.1:8080"
};

let api = new rcf.AuthorizedRestApi($node.get(), rcf.AuthorizedRestApi.connectOptionsToAccess(connectOptions));

export function Test() {
    let form = new FormData();
    form.append('FirstName', 'Wen');
    form.append('LastName', 'Chang');
    form.append("Myfile[]", fs.createReadStream('C:/Users/wchang/Desktop/signedcorrected 4506-T.pdf'), 'signedcorrected 4506-T.pdf');
    form.append("Myfile[]", fs.createReadStream('C:/Users/wchang/Desktop/polaris.txt'), 'polaris.txt');

    let handler = (err:any, ret:any) => {
        if (err)
            console.error("!!! Error: " + JSON.stringify(err));
        else
            console.log(typeof ret === 'string'? ret : JSON.stringify(ret));
    }

    //api.$F('/services/upload/file_upload', form, handler);
    api.$F('/services/upload/s3_upload', form, handler);
}