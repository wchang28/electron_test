import * as events from 'events';
import * as fs from 'fs';
import * as rcf from 'rcf';
import * as $node from 'rest-node';
import * as FormData from 'form-data';
import * as path from 'path';

export interface Status {
    uploading: boolean;
    stopping: boolean;
}

export interface UploadProgress {
    uploaded: number;
    total: number;
    percent: number;
    estimatedTotalDurationMS?: number;
    estimatedRemainMS?: number;
    estimatedFinishTime?: Date;
}

let connectOptions: rcf.ApiInstanceConnectOptions = {
	"instance_url": "http://127.0.0.1:8080"
};

let api = new rcf.AuthorizedRestApi($node.get(), rcf.AuthorizedRestApi.connectOptionsToAccess(connectOptions));

export class FilesUploader extends events.EventEmitter {
    private __uploading: boolean;
    private __stopping: boolean;
    private __startTime: Date;
    constructor() {
        super();
        this.__uploading = false;
        this.__stopping = false;
        this.__startTime = null;
    }
    get uploading() : boolean {
        return this.__uploading;
    }
    set uploading(newValue: boolean) {
        if (newValue !== this.__uploading) {
            this.__uploading = newValue;
            this.emit('status-changed', this.status);
        }
    }
    get stopping() : boolean {
        return this.__stopping;
    }
    set stopping(newValue: boolean) {
        if (newValue !== this.__stopping) {
            this.__stopping = newValue;
            this.emit('status-changed', this.status);
        }
    }
    get status() : Status {
        return {uploading: this.uploading, stopping: this.stopping};
    }
    private getProgress(uploaded:number, total:number) : UploadProgress {
        let now = new Date();
        let lapsedMS = now.getTime() - this.__startTime.getTime();
        let fraction = parseFloat(uploaded.toString())/parseFloat(total.toString());
        let progress: UploadProgress = {
            uploaded
            ,total
            ,percent: fraction * 100.0
        }
        if (fraction > 0) {
            progress.estimatedTotalDurationMS = lapsedMS / fraction;
            progress.estimatedRemainMS = progress.estimatedTotalDurationMS - lapsedMS;
            progress.estimatedFinishTime = new Date(now.getTime() + progress.estimatedRemainMS);
        }
        return progress;
    }
    private uploadFileImp(file:string, subFilderMaker: (file:string) => string, done:(err:any) => void) {
        let form = new FormData();
        let subFilder = subFilderMaker(file);
        let ret = path.parse(file);
        form.append('subFolder', subFilder);
        form.append("file", fs.createReadStream(file), ret.base);
        //api.$F('/services/upload/file_upload', form, done);
        console.log('uploading file: ' + file);
        api.$F('/services/upload/s3_upload', form, done);
    }
    upload(files: string[], subFilderMaker: (file:string) => string, done?:(canceled:boolean) =>void) : void {
        let n = (files ? files.length : 0);
        let getDoneHandler = (i: number) => {
            return (err:any) => {
                this.emit('upload-progress', this.getProgress(i+1, n));
                // progress (i+1)/n
                if (this.stopping || i === n - 1) {
                    let canceled = this.stopping;
                    this.__startTime = null;
                    this.uploading = false;
                    this.stopping = false;
                    if (typeof done === 'function') done(canceled);
                } else {
                    this.uploadFileImp(files[i + 1], subFilderMaker, getDoneHandler(i+1));
                }
            };
        };

        if (!this.uploading && !this.stopping && n > 0) {
            this.__startTime = new Date();
            this.uploading = true;
            this.uploadFileImp(files[0], subFilderMaker, getDoneHandler(0));
        }
    }
    stop() : void {
        if (this.uploading && !this.stopping) {
            this.stopping = true;
        }
    }
}