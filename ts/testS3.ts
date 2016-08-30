import * as fs from 'fs';
import * as AWS from 'aws-sdk';
import * as _ from 'lodash';
import * as stream from 'stream';
import * as path from 'path';

class Transformer extends stream.Transform {
    constructor(opts?: stream.TransformOptions) {
        super(opts);
    }
    _transform(chunk: any, encoding: string, callback: Function): void {
        callback(null, chunk);
    }
}

export function Test() : void {
    //let file = 'C:/test/apiuser@firstkeymortgage.com-deploy-1460735903961.zip';
    let file = 'C:/test/.npmignore';
    let ret = path.parse(file);
    let rs = fs.createReadStream(file);

    //////////////////////////////////////////////////////////////////////////////////////////////////
    let transform = new Transformer();
    let s3 = new AWS.S3();
    let params:any = {
        Bucket: 's3-fkh-tst'
        ,Key: 'busboy_upload/' + ret.base
        ,Body: transform
    };
    let additonalS3Options: any = {
        "ACL": "public-read"
        ,"ServerSideEncryption": "AES256"
    };
    if (additonalS3Options) params = _.assignIn(params, additonalS3Options);
    transform.on('pipe', () => {
        s3.upload(params)
        .on('httpUploadProgress', function(evt) {
            //console.log(evt);
        }).send(function(err, data) {
            transform.emit('close');
        });
    });
    //////////////////////////////////////////////////////////////////////////////////////////////////


    transform.on('close', function() {
        console.log('Done upload :=)');
    });
    rs.pipe(transform);
}
