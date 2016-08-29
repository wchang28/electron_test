import {app, BrowserWindow} from 'electron';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win:Electron.BrowserWindow;

function createWindow () {
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
  //win.webContents.openDevTools()

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

let walk = (dir:string, done: (err:any, results?:string[]) => void) : void => {
	let results = [];
	fs.readdir(dir, (err, list: string[]) => {
		if (err) return done(err);
		var i = 0;
		let next = () => {
			let file = list[i++];
			if (!file) return done(null, results);
			file = dir + '/' + file;
			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
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

import {Test as UploadTest} from './test';

export function Test() {
  let dirs = dialog.showOpenDialog(win,{properties: ['openFile', 'openDirectory']});
  if (dirs && dirs.length > 0) {
    let dir = dirs[0];
    console.log('dir=' + dir);
    walk(dir , (err: any, results:string[]) => {
      if (!err) {
        console.log(results);
        console.log('========================================================');
        console.log('number of files: ' + results.length);
        console.log('========================================================');
      }
    });

  }
}