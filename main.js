const { app, ipcMain, dialog, BrowserWindow, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const { extractTables } = require('./parser');

// Define paths for the parser
const inputCsvFilePath = path.join(__dirname, 'iQCExport.csv');
const outputJsonFilePath = path.join(__dirname, 'output.json');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Load the index.html of the app.
    win.loadFile('index.html');

    // Maximize the window
    win.maximize();

    // Open the DevTools automatically if you are in development
        win.webContents.openDevTools();
    

    // Parse the CSV file and handle the JSON output
    extractTables(inputCsvFilePath, outputJsonFilePath).then(() => {
        console.log('Parsing done and JSON saved.');
    });

    function readJsonAndSend(channel, key) {
      fs.readFile(outputJsonFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Failed to read ${outputJsonFilePath}:`, err);
        } else {
          const jsonData = JSON.parse(data);
          const item = jsonData[key];
          win.webContents.send(channel, item.data, item.id, item.type);
        }
      });
    }


    // Define the menu template
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Print',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => {
                        win.webContents.print({
                            silent: false,
                            printBackground: true,
                            color: false,
                            marginType: 'default'
                        });
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' }
            ]
        },
        {
            label: 'Add',
            submenu: [
                {
                    label: 'Textbox',
                    click: () => { 
                    // Send an IPC message to the renderer process to add a textbox
                    win.webContents.send('add-textbox');
                     }
                },
                {
                    label: 'Image',
                    click: () => { // Open a dialog to select an image
                        dialog.showOpenDialog({
                          properties: ['openFile'],
                          filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
                        }).then(result => {
                          if (!result.canceled) {
                            win.webContents.send('add-image', result.filePaths[0]);
                          }
                        }).catch(err => {
                          console.log('Error selecting image:', err);
                        });
                      }
                },
                {
                  label: 'Standard Name',
                  click: () => { readJsonAndSend('add-standard-name', 'standardName'); }
                },
                {
                  label: 'Standard Values',
                  click: () => { readJsonAndSend('add-standard-values', 'standardValues'); }
                },
                {
                  label: 'Trial Names',
                  click: () => { readJsonAndSend('add-trial-names', 'trialNames'); }
                },
                {
                  label: 'Trial Values',
                  click: () => { readJsonAndSend('add-trial-values', 'trialValues'); }
                },
                {
                  label: 'Tolerances',
                  click: () => { readJsonAndSend('add-tolerances', 'tolerancesTable'); }
                },
                {
                  label: 'Lightsources',
                  click: () => { readJsonAndSend('add-light-sources', 'lightSources'); }
                },
                {
                  label: 'Descriptions',
                  click: () => { readJsonAndSend('add-descriptions', 'descriptions'); }
                }

            ]
        }

    ];

    menuTemplate.push({
        label: 'Layout',
        submenu: [
          {
            label: 'New',
            click: () => {
              // Sayfayı temizlemek için renderer sürecine bir mesaj gönder
              win.webContents.send('clear-page');
            }

          },
          {
            label: 'Save',
            click: () => {
              dialog.showSaveDialog({
                title: 'Save Standard Name Properties',
                defaultPath: path.join(__dirname, 'standardNameProperties.json'),
                filters: [
                  { name: 'JSON Files', extensions: ['json'] }
                ]
              }).then(file => {
                if (!file.canceled && file.filePath) {
                  // Kullanıcı dosya yolu seçti ve iptal etmedi
                  console.log('Kaydedilecek dosya yolu:', file.filePath);
          
                  // savedProperties nesnesini almak için bir istek gönder
                  win.webContents.send('selected-save-file-path', file.filePath);

                  win.webContents.send('request-saved-properties');


                }
              }).catch(err => {
                console.error('Dosya kaydetme Error:', err);
              });
            }
            },
            {
              label: 'Load',
              click: () => {
                dialog.showOpenDialog({
                  title: 'Load Standard Name Properties',
                  defaultPath: path.join(__dirname, 'standardNameProperties.json'),
                  filters: [{ name: 'JSON Files', extensions: ['json'] }],
                  properties: ['openFile']
                }).then(file => {
                  if (!file.canceled && file.filePaths.length > 0) {
                    // Seçilen dosya yolunu renderer sürecine gönder
                    win.webContents.send('load-saved-properties-file-path', file.filePaths[0]);
                  }
                }).catch(err => {
                  console.error('Dosya açma Error:', err);
                });
            }
          }
        ]
      });


    // Build the menu from the template and set it
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


app.on('before-quit', () => {
    // Clear the JSON file before quitting
    try {
        fs.writeFileSync(outputJsonFilePath, JSON.stringify({}), 'utf8');
        console.log('Data cleared from JSON file.');
    } catch (error) {
        console.error('Failed to clear JSON file:', error);
    }
});


ipcMain.on('save-standard-name-properties', (event, properties) => {
  console.log('Standard Name özellikleri alındı:', properties);

  const filePath = path.join(__dirname, 'savedProperties.json'); // Kayıt dosyası yolu
  fs.writeFile(filePath, JSON.stringify(properties, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Dosya kaydedilemedi:', err);
      return;
    }
    console.log('Standard Name özellikleri kaydedildi:', filePath);
  });
});

ipcMain.on('request-load-data', (event) => {
  const savedPropertiesPath = path.join(__dirname, 'savedProperties.json');
  const outputPath = path.join(__dirname, 'output.json');

  fs.readFile(savedPropertiesPath, 'utf8', (err, savedData) => {
    if (err) {
      console.error('savedProperties.json dosyası okunamadı:', err);
      return;
    }

    fs.readFile(outputPath, 'utf8', (err, outputData) => {
      if (err) {
        console.error('output.json dosyası okunamadı:', err);
        return;
      }

      const savedProperties = JSON.parse(savedData);
      const outputJson = JSON.parse(outputData);
      event.sender.send('load-data', { savedProperties, outputJson });
    });
  });
});

ipcMain.on('response-save-properties', (event, savedProperties, filePath) => {
  // Dosya kaydetme işlemi
  fs.writeFile(filePath, JSON.stringify(savedProperties, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Dosya kaydedilemedi:', err);
    } else {
      console.log('Standard Name özellikleri kaydedildi:', filePath);
    }
  });
});

ipcMain.on('request-load-saved-properties', (event) => {
  const filePath = path.join(__dirname, 'standardNameProperties.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Dosya okunamadı:', err);
      return;
    }
    const savedProperties = JSON.parse(data);
    event.sender.send('load-saved-properties', savedProperties);
  });
});



// Standard Values özelliklerini kaydetme işlemi
ipcMain.on('save-standard-values-properties', (event, properties) => {
  // Burada properties'i dosyaya veya veritabanına kaydedin
  console.log('Kaydedilen Standard Values Özellikleri:', properties);
});
