import * as events from 'events';
import * as fs from 'fs';

export interface Status {
    running: boolean;
    stopping: boolean;
}

// emit the following events
// 1. status-changed (status)
// 2. n-walks-changed (n-walks)
// 3. files-count (files-count)
export class FolderEnumerator extends events.EventEmitter {
    private __nWalks:number;
    private __running: boolean;
    private __stopping: boolean;
    private __results: string[];
    constructor() {
        super();
        this.__running = false;
        this.__nWalks = 0;
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
    private decrementWalkCount() : number {
        this.__nWalks--;
        this.emit('n-walks-changed', this.__nWalks);
        if (this.__nWalks === 0) {
            this.__running = false;
            this.__stopping = false;
            this.emit('status-changed', this.status);
        }
        return this.__nWalks;
    }
    private walk(dir:string, done: (err:any) => void) : void {
        let exit = (err:any) => {
            this.decrementWalkCount();
            done(err);
        }

        this.__nWalks++;
        this.emit('n-walks-changed', this.__nWalks);

        if (this.__stopping) {
            exit(null);
        } else {
            fs.readdir(dir, (err, list: string[]) => {
                if (err) {
                    exit(err);
                } else if (this.__stopping) {
                    exit(null);
                } else {
                    var i = 0;
                    let next = () => {
                        if (this.__stopping)
                            exit(null);
                        else {
                            let file = list[i++];
                            if (!file) {    // no more file
                                exit(null);
                            }
                            file = dir + '/' + file;
                            fs.stat(file, (err, stats:fs.Stats) => {
                                if (stats && stats.isDirectory()) { // a folder
                                    this.walk(file, (err:any) => {
                                        next();
                                    });
                                } else {    // a regular file
                                    this.__results.push(file);
                                    this.emit('files-count', this.filesCount);
                                    next();
                                }
                            });
                        }
                    };
                    next();
                }
            });
        }
    };

    run(dir:string) : void {
        if (!this.running && !this.stopping) {
            this.running = true;
            this.__results = [];
            this.emit('files-count', this.filesCount);
            this.walk(dir, (err:any) => {});
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