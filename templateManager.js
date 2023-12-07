const fs = require('fs');
const { ipcRenderer } = require('electron');

function saveStandardNameProperties() {
  const standardNameContainer = document.querySelector('#standard-name-container'); // Bu sınıf adını, Standard Name kutucuğunuz için kullandığınız sınıfla değiştirin
  if (standardNameContainer) {
    const properties = {
      id: standardNameContainer.id,
      type: standardNameContainer.dataset.type = 'standard-name', // type'ı 'data-type' gibi bir attribute olarak sakladığınızı varsayıyorum
      position: {
        x: standardNameContainer.style.left,
        y: standardNameContainer.style.top
      },
      size: {
        width: standardNameContainer.offsetWidth,
        height: standardNameContainer.offsetHeight
      }
    };
    console.log('Standard Name özellikleri gönderiliyor:', properties);

    ipcRenderer.send('save-standard-name-properties', properties);
  } else {
    console.log('Standard Name kutucuğu bulunamadı.');
  }
  
}

ipcRenderer.on('trigger-save-standard-name-properties', () => {
  console.log('Save tetiklendi.');
  saveStandardNameProperties();
});

ipcRenderer.on('trigger-load-standard-name-properties', () => {
  console.log('Load işlemi tetiklendi.');
  ipcRenderer.send('request-load-data');
});

ipcRenderer.on('load-data', (event, { savedProperties, outputJson }) => {
  const standardNameData = outputJson.standardName.data;
  const properties = savedProperties; // veya savedProperties.standardName gibi bir yapıya sahipse uygun şekilde değiştirin

  // Kutucuğu oluşturun ve özelliklerini ayarlayın
  const newStandardNameContainer = document.createElement('div');

  if (properties && properties.id) {
    newStandardNameContainer.id = properties.id;
    newStandardNameContainer.classList.add('draggable-text');
    newStandardNameContainer.style.left = properties.position.x;
    newStandardNameContainer.style.top = properties.position.y;
    newStandardNameContainer.style.width = properties.size.width + 'px';
    newStandardNameContainer.style.height = properties.size.height + 'px';
  }
  // Label elementi oluştur
  const nameLabel = document.createElement('span');
  nameLabel.textContent = 'Standard Name: ';
  nameLabel.style.fontWeight = 'bold';

  // Standard Name verisini kutucuğa ekle
  const nameElement = document.createElement('span');
  nameElement.textContent = standardNameData;

  newStandardNameContainer.appendChild(nameLabel);
  newStandardNameContainer.appendChild(nameElement);

  // Kutucuğu sayfaya ekleyin
  const printableArea = document.getElementById('printableArea');
  printableArea.appendChild(newStandardNameContainer);

  // Kutucuğu sürüklenebilir ve yeniden boyutlandırılabilir yapın
  makeDraggable(newStandardNameContainer);
  makeResizable(newStandardNameContainer);
});

function getStandardNameProperties() {
  const standardNameContainer = document.getElementById('standard-name-container');
  if (!standardNameContainer) {
    console.error('Standard Name kutucuğu bulunamadı');
    return null;
  }

  return {
    id: standardNameContainer.id,
    position: {
      x: standardNameContainer.style.left,
      y: standardNameContainer.style.top
    },
    size: {
      width: standardNameContainer.offsetWidth,
      height: standardNameContainer.offsetHeight
    }
    // Diğer özellikler gerekiyorsa burada ekleyebilirsiniz
  };
}

let selectedFilePath;

ipcRenderer.on('selected-save-file-path', (event, filePath) => {
  selectedFilePath = filePath;
});

ipcRenderer.on('request-saved-properties', () => {
  const savedProperties = getStandardNameProperties();
  if (savedProperties && selectedFilePath) {
    ipcRenderer.send('response-save-properties', savedProperties, selectedFilePath);
  }
});

ipcRenderer.on('load-saved-properties', (event, savedProperties) => {
  // Mevcut Standard Name kutucuğunu sayfadan kaldır (varsa)
  const existingContainer = document.getElementById(savedProperties.id);
  if (existingContainer) {
    existingContainer.remove();
  }

  // Yeni Standard Name kutucuğunu oluştur
  const standardNameContainer = document.createElement('div');
  standardNameContainer.id = savedProperties.id;
  standardNameContainer.classList.add('draggable-text'); // Varsayılan sınıfınız veya gereken sınıflar
  standardNameContainer.style.position = 'absolute';
  standardNameContainer.style.left = savedProperties.position.x;
  standardNameContainer.style.top = savedProperties.position.y;
  standardNameContainer.style.width = savedProperties.size.width + 'px';
  standardNameContainer.style.height = savedProperties.size.height + 'px';

  // Etiket ve metin içeriğini ekle
  const nameLabel = document.createElement('span');
  nameLabel.textContent = 'Standard Name: ';
  nameLabel.style.fontWeight = 'bold';

  const nameContent = document.createElement('span');
  nameContent.textContent = 'Standard Name verisi'; 

  standardNameContainer.appendChild(nameLabel);
  standardNameContainer.appendChild(nameContent);

  // Kutucuğu sayfaya ekleyin
  const printableArea = document.getElementById('printableArea'); // veya kutucuğu eklemek istediğiniz alanın id'si
  printableArea.appendChild(standardNameContainer);

  makeDraggable(standardNameContainer); makeResizable(standardNameContainer);
});

ipcRenderer.on('load-saved-properties-file-path', (event, filePath) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Dosya okunamadı:', err);
      return;
    }
    const savedProperties = JSON.parse(data);

    // Mevcut Standard Name kutucuğunu sayfadan kaldır (varsa)
    const existingContainer = document.getElementById(savedProperties.id);
    if (existingContainer) {
      existingContainer.remove();
    }

    // Yeni Standard Name kutucuğunu oluştur
    const standardNameContainer = document.createElement('div');
    standardNameContainer.id = savedProperties.id;
    standardNameContainer.classList.add('draggable-text'); // Varsayılan sınıfınız veya gereken sınıflar
    standardNameContainer.style.position = 'absolute';
    standardNameContainer.style.left = savedProperties.position.x;
    standardNameContainer.style.top = savedProperties.position.y;
    standardNameContainer.style.width = savedProperties.size.width + 'px';
    standardNameContainer.style.height = savedProperties.size.height + 'px';

    // Etiket ve metin içeriğini ekle
    const nameLabel = document.createElement('span');
    nameLabel.textContent = 'Standard Name: ';
    nameLabel.style.fontWeight = 'bold';

    const nameContent = document.createElement('span');
    
    // output.json dosyasını oku
    const outputJsonPath = 'output.json'; // output.json dosyasının yolu
    fs.readFile(outputJsonPath, 'utf8', (outputErr, outputData) => {
      if (outputErr) {
        console.error('output.json dosyası okunamadı:', outputErr);
        return;
      }
      const outputJson = JSON.parse(outputData);
    
    
    nameContent.textContent = outputJson.standardName.data; // 'standardName' özelliği ve 'data' alt özelliği
    });
    standardNameContainer.appendChild(nameLabel);
    standardNameContainer.appendChild(nameContent);

    // Kutucuğu sayfaya ekleyin
    const printableArea = document.getElementById('printableArea'); // veya kutucuğu eklemek istediğiniz alanın id'si
    printableArea.appendChild(standardNameContainer);

    makeDraggable(standardNameContainer); makeResizable(standardNameContainer);
  });
});

ipcRenderer.on('clear-page', () => {
  // Sayfadaki Standard Name kutucuğunu ve diğer dinamik içerikleri kaldır
  const standardNameContainer = document.getElementById('standard-name-container');
  if (standardNameContainer) {
    standardNameContainer.remove();
  }
  
  // Eğer sayfada başka dinamik içerikler varsa, burada kaldırın
  // Örnek: Diğer elementleri kaldırma işlemleri...
});


// "Standard Values" özelliğini kaydetme işlevi
function saveStandardValuesProperties() {
  const standardValuesContainer = document.getElementById('standard-values-container');
  if (standardValuesContainer) {
    const properties = {
      id: standardValuesContainer.id,
      position: {
        x: standardValuesContainer.style.left,
        y: standardValuesContainer.style.top
      },
      size: {
        width: standardValuesContainer.offsetWidth,
        height: standardValuesContainer.offsetHeight
      }
    };
    ipcRenderer.send('save-standard-values-properties', properties);
  } else {
    console.log('Standard Values container bulunamadı.');
  }
}

// "Standard Values" özelliğini yükleme işlevi
function loadStandardValuesProperties(properties) {
  const standardValuesContainer = document.createElement('div');
  standardValuesContainer.id = properties.id;
  standardValuesContainer.style.left = properties.position.x;
  standardValuesContainer.style.top = properties.position.y;
  standardValuesContainer.style.width = properties.size.width + 'px';
  standardValuesContainer.style.height = properties.size.height + 'px';

  // Burada Standard Values verilerini ekleyin
  // Örnek: standardValuesContainer.textContent = 'Verileriniz burada';

  document.body.appendChild(standardValuesContainer);
}










module.exports = {
    saveStandardNameProperties,
  };
  



