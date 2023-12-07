const interact = require('interactjs');
const fs = require('fs');
const { saveStandardNameProperties, loadStandardNameProperties } = require('./templateManager');



// This function makes an element draggable
function makeDraggable(element) {
  interact(element).draggable({
    listeners: {
      move(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        // Update the position of the element
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;

        // Update the data attributes
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
      }
    }
  });
}

// Updated makeResizable function that checks if the element is an image
function makeResizable(element) {
  // Check if the element is an image to preserve the aspect ratio
  const isImage = element.tagName.toLowerCase() === 'img';

  interact(element).resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    // Preserve the aspect ratio for images
    modifiers: isImage ? [
      interact.modifiers.aspectRatio({
        // If the element has a defined aspect ratio use that, otherwise use the natural one
        ratio: element.hasAttribute('data-aspect-ratio') ? parseFloat(element.getAttribute('data-aspect-ratio')) : element.naturalWidth / element.naturalHeight
      })
    ] : [],
    listeners: {
      move(event) {
        let { x, y } = event.target.dataset;

        x = (parseFloat(x) || 0) + event.deltaRect.left;
        y = (parseFloat(y) || 0) + event.deltaRect.top;

        Object.assign(event.target.style, {
          width: `${event.rect.width}px`,
          height: `${event.rect.height}px`,
          // We're using translate to maintain the drag functionality
          transform: `translate(${x}px, ${y}px)`
        });

        // Update the position data attributes
        event.target.dataset.x = x;
        event.target.dataset.y = y;

        // Update the width and height data attributes if it's an image
        if (isImage) {
          event.target.dataset.width = event.rect.width;
          event.target.dataset.height = event.rect.height;
        }
      }
    }
  });
}



// Adds a new textbox inside the printable area
function addTextbox() {
  const printableArea = document.getElementById('printableArea');
  const textbox = document.createElement('textarea');
  textbox.classList.add('draggable-textbox');
  printableArea.appendChild(textbox);

  // Initialize the position and size data attributes
  textbox.setAttribute('data-x', 0);
  textbox.setAttribute('data-y', 0);
  textbox.setAttribute('data-width', '100px'); // Default width
  textbox.setAttribute('data-height', '50px'); // Default height

  textbox.style.transform = 'translate(0px, 0px)';
  textbox.style.width = '100px';
  textbox.style.height = '50px';
  // Initialize the position using left and top instead of transform
  textbox.style.left = '0px';
  textbox.style.top = '0px';

  // Make the textbox draggable and resizable
  makeDraggable(textbox);
  makeResizable(textbox);
}

// Listen for the 'add-textbox' event from main.js
ipcRenderer.on('add-textbox', addTextbox);


// Function to add a new image to the printable area
function addImage(imagePath) {
  const printableArea = document.getElementById('printableArea');
  const image = new Image();
  image.src = imagePath;
  image.classList.add('draggable-image');
  printableArea.appendChild(image);

  // Initialize the position using left and top
  image.style.left = '0px';
  image.style.top = '0px';

  // Make the image draggable and resizable
  makeDraggable(image);
  makeResizable(image);
}

// Listen for the 'add-image' event from main.js
ipcRenderer.on('add-image', (event, imagePath) => {
  addImage(imagePath);
});

// Function to add a standard name to the printable area
function addStandardName(standardName, id, type) {
  const printableArea = document.getElementById('printableArea');
  
  // Create a container for the standard name and its label
  const nameContainer = document.createElement('div');
  nameContainer.classList.add('draggable-text');
  nameContainer.id = 'standard-name-container'; 
  nameContainer.dataset.type = 'standard-name';



  // Create the label element
  const nameLabel = document.createElement('span');
  nameLabel.textContent = 'Standard Name: ';
  nameLabel.style.fontWeight = 'bold';

  // Create the name element
  const nameElement = document.createElement('span');
  nameElement.textContent = standardName;

  // Append both the label and the name to the container
  nameContainer.appendChild(nameLabel);
  nameContainer.appendChild(nameElement);
  printableArea.appendChild(nameContainer);

  // Initialize the position using left and top
  nameContainer.style.position = 'absolute';
  nameContainer.style.left = '0px';
  nameContainer.style.top = '0px';

  // Make the container for standard name draggable and resizable
  makeDraggable(nameContainer);
  makeResizable(nameContainer);

// Kutucuğun özelliklerini konsola bas
console.log('Standard Name kutucuğu özellikleri:');
console.log('ID:', id);
console.log('Type:', type);
console.log('Data:', standardName);
console.log('X koordinat:', nameContainer.style.left);
console.log('Y koordinat:', nameContainer.style.top);
console.log('Genişlik:', nameContainer.offsetWidth + 'px');
console.log('Yükseklik:', nameContainer.offsetHeight + 'px');


}

// Listen for the 'add-standard-name' event from main.js
ipcRenderer.on('add-standard-name', (event, standardName, id, type) => {
  addStandardName(standardName, id, type);
});

function showInfoMessage(message) {
  const infoBar = document.getElementById('infoBar');
  
  // Update the text and make the info bar visible
  infoBar.textContent = message;
  infoBar.style.display = 'block';

  // Hide the info bar after 2 seconds (2000 milliseconds)
  setTimeout(() => {
    infoBar.style.display = 'none';
  }, 2000);
}

// Save the original console.log function
const originalConsoleLog = console.log;

// Override console.log
console.log = function(...args) {
  // Call the original console.log function with all arguments
  originalConsoleLog.apply(console, args);

  // Convert all arguments into a readable string
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (error) {
        return "Unstringifiable object";
      }
    } else {
      return String(arg);
    }
  }).join(' ');

  // Show the message in the info bar
  showInfoMessage(message);
};

// Function to show messages in the info bar
function showInfoMessage(message) {
  const infoBar = document.getElementById('infoBar');
  
  // Update the text and make the info bar visible
  infoBar.textContent = message;
  infoBar.style.display = 'block';

  // Hide the info bar after a few seconds
  setTimeout(() => {
    infoBar.style.display = 'none';
  }, 2000); // Adjust time as needed
}

function addStandardValuesTable(standardTable) {
  const printableArea = document.getElementById('printableArea');
  const table = document.createElement('table');
  table.classList.add('draggable-table');
  printableArea.appendChild(table);

  // Iterate over each row in the standardTable array
  standardTable.forEach((row, index) => {
    const tableRow = document.createElement('tr');
    table.appendChild(tableRow);

    // Iterate over each cell in the row
    row.forEach(cell => {
      if (cell !== null) {  // Skip cells that contain null
        const cellElement = index === 0 ? document.createElement('th') : document.createElement('td');
        cellElement.textContent = cell;
        tableRow.appendChild(cellElement);
      }
    });
  });

  // Initialize the position using left and top
  table.style.position = 'absolute';
  table.style.left = '0px';
  table.style.top = '0px';

  // Make the table draggable and resizable
  makeDraggable(table);
  makeResizable(table);
}

// Listen for the 'add-standard-values' event from main.js
ipcRenderer.on('add-standard-values', (event, standardTable) => {
  addStandardValuesTable(standardTable);
});



// Function to add trial names to the printable area
function addTrialNames(trialNames) {
  const printableArea = document.getElementById('printableArea');

  // Create a container for the trial names and the header
  const namesContainer = document.createElement('div');
  namesContainer.classList.add('draggable-text-container');
  printableArea.appendChild(namesContainer);

  // Create the header
  const header = document.createElement('div');
  header.textContent = 'Trial Names';
  header.style.fontWeight = 'bold';
  namesContainer.appendChild(header);

  // Add each trial name to the container
  trialNames.forEach(name => {
    const nameElement = document.createElement('div');
    nameElement.textContent = name;
    namesContainer.appendChild(nameElement);
  });

  // Initialize the position using left and top
  namesContainer.style.position = 'absolute';
  namesContainer.style.left = '0px';
  namesContainer.style.top = '0px';

  // Make the names container draggable and resizable
  makeDraggable(namesContainer);
  makeResizable(namesContainer);
}

// Listen for the 'add-trial-names' event from main.js
ipcRenderer.on('add-trial-names', (event, trialNames) => {
  addTrialNames(trialNames);
});


// Function to add trial values to the printable area
function addTrialValues(trialValues) {
  const printableArea = document.getElementById('printableArea');

  // Create the table element
  const table = document.createElement('table');
  table.classList.add('draggable-table');
  printableArea.appendChild(table);

  // Iterate over each row in the trialValues array
  trialValues.forEach((row, index) => {
    const tableRow = document.createElement('tr');
    table.appendChild(tableRow);

    // Iterate over each cell in the row
    row.forEach((cell, cellIndex) => {
      const cellElement = (index === 0 || cellIndex === 0) ? document.createElement('th') : document.createElement('td');
      cellElement.textContent = cell !== null ? cell : ''; // Display an empty string instead of null
      tableRow.appendChild(cellElement);
    });
  });

  // Initialize the position using left and top
  table.style.position = 'absolute';
  table.style.left = '0px';
  table.style.top = '0px';

  // Make the table draggable and resizable
  makeDraggable(table);
  makeResizable(table);
}

// Listen for the 'add-trial-values' event from main.js
ipcRenderer.on('add-trial-values', (event, trialValues) => {
  addTrialValues(trialValues);
});


// Function to add tolerances to the printable area
function addTolerances(tolerances) {
  const printableArea = document.getElementById('printableArea');

  // Create the table element
  const table = document.createElement('table');
  table.classList.add('draggable-table');
  printableArea.appendChild(table);

  // Iterate over each row in the tolerances array
  tolerances.forEach((row, index) => {
    const tableRow = document.createElement('tr');
    table.appendChild(tableRow);

    // Iterate over each cell in the row
    row.forEach(cell => {
      const cellElement = index === 0 ? document.createElement('th') : document.createElement('td');
      cellElement.textContent = cell !== null ? cell : ''; // Display an empty string instead of null
      tableRow.appendChild(cellElement);
    });
  });

  // Initialize the position using left and top
  table.style.position = 'absolute';
  table.style.left = '0px';
  table.style.top = '0px';

  // Make the table draggable and resizable
  makeDraggable(table);
  makeResizable(table);
}

// Listen for the 'add-tolerances' event from main.js
ipcRenderer.on('add-tolerances', (event, tolerances) => {
  addTolerances(tolerances);
});

// Function to add light sources to the printable area
function addLightSources(lightSources) {
  const printableArea = document.getElementById('printableArea');

  // Create a container for the light sources
  const sourcesContainer = document.createElement('div');
  sourcesContainer.classList.add('draggable-text-container');
  printableArea.appendChild(sourcesContainer);

  // Create and add a header for the light sources
  const header = document.createElement('div');
  header.textContent = 'ill-obs';
  header.style.fontWeight = 'bold';
  sourcesContainer.appendChild(header);

  // Add each light source to the container
  lightSources.forEach(source => {
    const sourceElement = document.createElement('div');
    sourceElement.textContent = source;
    sourcesContainer.appendChild(sourceElement);
  });

  // Initialize the position using left and top
  sourcesContainer.style.position = 'absolute';
  sourcesContainer.style.left = '0px';
  sourcesContainer.style.top = '0px';

  // Make the container draggable and resizable
  makeDraggable(sourcesContainer);
  makeResizable(sourcesContainer);
}

// Listen for the 'add-light-sources' event from main.js
ipcRenderer.on('add-light-sources', (event, lightSources) => {
  addLightSources(lightSources);
});


// Function to add descriptions to the printable area
function addDescriptions(descriptions) {
  const printableArea = document.getElementById('printableArea');

  // Create the table element
  const table = document.createElement('table');
  table.classList.add('draggable-table');
  printableArea.appendChild(table);

  // Iterate over each description
  descriptions.forEach((desc, index) => {
    const tableRow = document.createElement('tr');
    table.appendChild(tableRow);

    // Iterate over each part of the description
    desc.forEach(text => {
      const cell = index === 0 ? document.createElement('th') : document.createElement('td');
      // Insert a dash if there is no text
      cell.textContent = text || '-';
      tableRow.appendChild(cell);
    });
  });

  // Initialize the position using left and top
  table.style.position = 'absolute';
  table.style.left = '0px';
  table.style.top = '0px';

  // Make the table draggable and resizable
  makeDraggable(table);
  makeResizable(table);
}


// Listen for the 'add-descriptions' event from main.js
ipcRenderer.on('add-descriptions', (event, descriptions) => {
  addDescriptions(descriptions);
});



function triggerSaveStandardValues() {
  // Örneğin, belirli bir düğmeye basıldığında bu fonksiyonu çağırın
  saveStandardValuesProperties(); // templateManager.js'den gelen fonksiyon
}

// Standard Values özelliklerini yüklemek için tetikleyici
function triggerLoadStandardValues() {
  // Verileri yüklemek için gereken kodlar
  // Örneğin, bir dosyadan veya veritabanından veri çekip loadStandardValuesProperties fonksiyonuna gönderin
}