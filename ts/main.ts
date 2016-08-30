import {app, BrowserWindow} from 'electron';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win:Electron.BrowserWindow;

import {Test as TestS3} from './testS3'
function createWindow () {
  TestS3();
  /*
  let file = 'C:/upload/.npmignore';
  let rs = fs.createReadStream(file, 'utf8');
  let ws = fs.createWriteStream('c:/tmp/.npmignore');
  rs.on('data', (data:string) => {
    console.log(data);
  }).on('end', () => {
    console.log('rs <<END>>');
  });
  ws.on('close', () => {
    console.log('ws <<CLOSE>>');
  });
  rs.pipe(ws);
  */

  let options: Electron.BrowserWindowOptions = {};
  options.width = 800;
  options.height = 600;
  options.autoHideMenuBar = true;
  options.darkTheme = true;
  options.title = "HaS Uploader";
  // Create the browser window.
  win = new BrowserWindow(options);

  // and load the index.html of the app.
  //win.loadURL(`file://${__dirname}/../public/index.html`)
  win.loadURL(`file://${__dirname}/../js/ui/index.html`)

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

import {dialog} from 'electron';
import * as fs from 'fs';
import * as fe from './folderEnumerator';

let walk = (dir:string, done: (err:any, results?:string[]) => void) : void => {
	let results = [];
	fs.readdir(dir, (err, list: string[]) => {
		if (err) return done(err);
		var i = 0;
		let next = () => {
			let file = list[i++];
			if (!file) return done(null, results);
			file = dir + '/' + file;
			fs.stat(file, function(err, stats:fs.Stats) {
				if (stats && stats.isDirectory()) {
					walk(file, (err:any, res?:string[]) => {
						results = results.concat(res);
						next();
					});
				} else {
					results.push(file);
					next();
				}
			});
		};

		next();
	});
};

export interface IFolderSelected {
  dir: string;
  files: string[];
}

export interface IFolderSelectedStat {
  dir: string;
  numFiles: number;
}

let __selected: IFolderSelected = null;

export function getCurrentFolderSelectedStat() : IFolderSelectedStat {
  return (__selected && __selected.dir && __selected.files && __selected.files.length > 0 ? {dir:__selected.dir, numFiles: __selected.files.length} : null);
}

/*
export function selectAndEnumFilesInDir(done:(err:any) => void) {
  let dirs = dialog.showOpenDialog(win,{properties: ['openFile', 'openDirectory']});
  if (dirs && dirs.length > 0) {
    let dir = dirs[0];
    console.log('dir=' + dir);
    walk(dir , (err: any, results:string[]) => {
      if (!err) {
        __selected = {
          dir
          ,files: results
        };
        console.log(results);
        console.log('========================================================');
        console.log('number of files: ' + results.length);
        console.log('========================================================');
        done(null);
      } else
        done(err);
    });

  } else {
    done(null);
  }
}
*/

import * as path from 'path';
import * as fu from './filesUploader';

let enumerator = new fe.FolderEnumerator();

export function selectAndEnumFilesInDir(done:(err:any) => void) {
  let dirs = dialog.showOpenDialog(win,{properties: ['openFile', 'openDirectory']});
  if (dirs && dirs.length > 0) {
    let dir = dirs[0];
    dir = dir.replace(/\\/gi, '/');
    console.log('dir=' + dir);
    enumerator.on('status-changed', (status:fe.Status) => {
      console.log('status=' + JSON.stringify(status));
      if (!status.running) {
        console.log('files-count=' + enumerator.filesCount.toString());
      }
    }).on('files-count', (filesCount: number) => {
      //console.log('files-count=' + filesCount.toString());
    })
    enumerator.run(dir, (canceled: boolean) => {
      if (!canceled) {
         console.log(dir);
        //console.log(enumerator.results);
        let subFilderMaker = (file:string): string => {
          let ret = path.parse(file);
          let s = ret.dir.substr((dir).length)
          return s;
        };
        /*
        for (let i in enumerator.results) {
          console.log(enumerator.results[i] + ' ---> ' + subFilderMaker(enumerator.results[i]));
        }
        */
        let uploader = new fu.FilesUploader();
        uploader.on('upload-progress', (status:fu.Status) => {
          //console.log('status=' + JSON.stringify(status));
        })
        uploader.upload(enumerator.results, subFilderMaker, (canceled: boolean) => {
          console.log('Done');
        });
      }
    });
    /*
    setTimeout(() => {
      if (enumerator.running) {
        console.log('stopping the run');
        enumerator.stop();
      }
    }, 15000);
    */
  }
}



//import {Test as UploadTest} from './test';

/*
export function Test(done:(err:any, result:any) => void) {

    let handler = (err:any, ret:any) => {
        if (err)
            console.error("!!! Error: " + JSON.stringify(err));
        else
            console.log(typeof ret === 'string'? ret : JSON.stringify(ret));

        done(err, ret);
    }

  UploadTest(handler);
}

*/