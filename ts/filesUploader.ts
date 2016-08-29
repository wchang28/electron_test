import * as events from 'events';
import * as fs from 'fs';

export interface UploadProgress {
    uploaded: number;
    total: number;
    percent: number;
    estimatedTotalDurationMS?: number;
    estimatedRemainMS?: number;
    estimatedFinishTime?: Date;
}

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
            this.emit('status-changed');
        }
    }
    get stopping() : boolean {
        return this.__stopping;
    }
    set stopping(newValue: boolean) {
        if (newValue !== this.__stopping) {
            this.__stopping = newValue;
            this.emit('status-changed');
        }
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
    private uploadFileImp(file:string, done:(err:any) => void) {
        // TODO:
    }
    upload(files: string[]) : void {
        let n = (files ? files.length : 0);
        let getDoneHandler = (i: number) => {
            return (err:any) => {
                this.emit('upload-progress', this.getProgress(i+1, n));
                // progress (i+1)/n
                if (this.stopping || i === n - 1) {
                    this.__startTime = null;
                    this.uploading = false;
                    this.stopping = false;
                } else {
                    this.uploadFileImp(files[i + 1], getDoneHandler(i+1));
                }
            };
        };

        if (!this.uploading && !this.stopping && n > 0) {
            this.__startTime = new Date();
            this.uploading = true;
            this.uploadFileImp(files[0], getDoneHandler(0));
        }
    }
    stop() : void {
        if (this.uploading && !this.stopping) {
            this.stopping = true;
        }
    }
}