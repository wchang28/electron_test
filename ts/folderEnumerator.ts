import * as events from 'events';
import * as fs from 'fs';

export interface Status {
    running: boolean;
    stopping: boolean;
}

// emit the following events
// 1. status-changed (status)
// 2. files-count (files-count)
export class FolderEnumerator extends events.EventEmitter {
    private __running: boolean;
    private __stopping: boolean;
    private __results: string[];
    constructor() {
        super();
        this.__running = false;
        this.__stopping = false;
        this.__results = [];
    }
    get running() : boolean {
        return this.__running;
    }
    set running(newValue: boolean) {
        if (newValue != this.__running) {
            this.__running = newValue;
            this.emit('status-changed', this.status);
        }
    }
    get stopping() : boolean {
        return this.__stopping;
    }
    set stopping(newValue: boolean) {
        if (newValue != this.__stopping) {
            this.__stopping = newValue;
            this.emit('status-changed', this.status);
        }
    }   
    get status() : Status {
        return {running: this.running, stopping: this.stopping};
    }
    get results() : string[] {
        return this.__results;
    }
    get filesCount() : number {
        return (this.__results ? this.__results.length : 0);
    }
    private walk(dir:string, done: (err:any) => void) : void {
        //console.log('walk in ' + dir);
        if (this.stopping) {
            done(null);
        } else {
            fs.readdir(dir, (err, list: string[]) => {
                if (err) {
                    done(err);
                } else {
                    if (list && list.length > 0) {
                        let next = (i:number) => {
                            let file = list[i];
                            file = dir + '/' + file;
                            fs.stat(file, (err, stats:fs.Stats) => {
                                if (stats && stats.isDirectory()) { // a folder
                                    this.walk(file, (err:any) => {
                                        //console.log('walk out ' + file);
                                        if (i+1 < list.length)
                                            next(i+1);
                                        else
                                            done(null);
                                    });
                                } else {    // a regular file
                                    this.__results.push(file);
                                    this.emit('files-count', this.filesCount);
                                    if (i+1 < list.length)
                                        next(i+1);
                                    else
                                        done(null);
                                }
                            });
                        };
                        next(0);
                    } else {    // no file in dir
                        done(null);
                    }
                }
            });
        }
    };

    run(dir:string) : void {
        if (!this.running && !this.stopping) {
            this.running = true;
            this.__results = [];
            this.emit('files-count', this.filesCount);
            this.walk(dir, (err:any) => {
                this.stopping = false;
                this.running = false;
            });
        }
    }

    stop() : void {
        if (this.running && !this.stopping) {
            this.stopping = true;
        }
    }

    clearResults() : void {
        this.__results = [];
        this.emit('files-count', this.filesCount);
    }
}