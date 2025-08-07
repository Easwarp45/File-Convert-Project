// main.js
// Universal File Converter logic

const fileInput = document.getElementById('file-input');
const formatOptions = document.getElementById('format-options');
const convertBtn = document.getElementById('convert-btn');
const previewSection = document.getElementById('preview-section');
const downloadSection = document.getElementById('download-section');
const messageSection = document.getElementById('message-section');
const dropArea = document.getElementById('drop-area');

let selectedFile = null;
let selectedFormat = null;
const imageFormats = ['png', 'jpeg', 'webp'];

// Drag and drop events
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('dragover');
  });
});
dropArea.addEventListener('drop', (e) => {
  const files = e.dataTransfer.files;
  if (files && files[0]) {
    fileInput.files = files;
    handleFile(files[0]);
  }
});
dropArea.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
  resetUI();
  if (!file) return;
  selectedFile = file;
  const ext = file.name.split('.').pop().toLowerCase();
  if (file.type.startsWith('image/')) {
    showImagePreview(file);
    showFormatOptions(imageFormats, ext);
    convertBtn.disabled = false;
    messageSection.textContent = '';
  } else if (file.type === 'application/pdf') {
    showPDFPreview(file);
    showFormatOptions([], ext, 'PDF conversion is not supported in-browser.');
    convertBtn.disabled = true;
  } else if (ext === 'doc' || ext === 'docx') {
    showMessage('Word file preview only. Conversion not supported in-browser.');
    convertBtn.disabled = true;
  } else if (ext === 'ppt' || ext === 'pptx') {
    showMessage('PPT file preview only. Conversion not supported in-browser.');
    convertBtn.disabled = true;
  } else {
    showMessage('Unsupported file type.');
    convertBtn.disabled = true;
  }
}

function showImagePreview(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    previewSection.innerHTML = `<img src="${e.target.result}" alt="preview" />`;
  };
  reader.readAsDataURL(file);
}

function showPDFPreview(file) {
  const url = URL.createObjectURL(file);
  previewSection.innerHTML = `<embed src="${url}" type="application/pdf" />`;
}

function showFormatOptions(formats, currentExt, msg) {
  if (formats.length === 0) {
    formatOptions.style.display = 'none';
    if (msg) showMessage(msg);
    return;
  }
  formatOptions.style.display = 'flex';
  formatOptions.innerHTML = '<span style="font-weight:600; color:#2563eb;">Convert to:</span>' +
    formats.map(fmt => `<label><input type=\"radio\" name=\"format\" value=\"${fmt}\" ${fmt===currentExt?'checked':''}/><span>${fmt.toUpperCase()}</span></label>`).join(' ');
  selectedFormat = currentExt;
  formatOptions.querySelectorAll('input[name=\"format\"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      selectedFormat = e.target.value;
    });
  });
}

function showMessage(msg) {
  messageSection.textContent = msg;
  previewSection.innerHTML = '';
  downloadSection.innerHTML = '';
}

function resetUI() {
  previewSection.innerHTML = '';
  downloadSection.innerHTML = '';
  messageSection.textContent = '';
  formatOptions.innerHTML = '';
  formatOptions.style.display = 'none';
  convertBtn.disabled = true;
}

// Conversion logic for images
function convertImage(file, toFormat) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        resolve(blob);
      }, 'image/' + toFormat);
    };
    img.onerror = reject;
    const reader = new FileReader();
    reader.onload = function(e) {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Handle form submit
const form = document.getElementById('upload-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedFile || !selectedFormat) return;
  if (selectedFile.type.startsWith('image/')) {
    convertBtn.disabled = true;
    messageSection.textContent = 'Converting...';
    try {
      const blob = await convertImage(selectedFile, selectedFormat);
      const url = URL.createObjectURL(blob);
      downloadSection.innerHTML = `<a href="${url}" download="converted.${selectedFormat}">Download ${selectedFormat.toUpperCase()}</a>`;
      messageSection.textContent = 'Conversion successful!';
    } catch {
      messageSection.textContent = 'Conversion failed.';
    }
    convertBtn.disabled = false;
  }
});
