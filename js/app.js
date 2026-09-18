/**
 * Custom QR Code Generator & Document Scanner Engine
 * Real-time PNG, SVG, Vector rendering with GSTIN, Phone, UPI, Wi-Fi, vCard support
 * In-browser Photo, Multi-page PDF Document & Live Camera QR Decoding
 */

(function () {
  'use strict';

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let qrCode = null;
  let currentMode = 'url';
  let currentScanMode = 'upload';
  let uploadedLogoUrl = null;
  let html5QrScanner = null;
  let isCameraScanning = false;
  let currentScannedData = '';

  const config = {
    data: 'https://smartcalcpro.online',
    width: 320,
    height: 320,
    qrColor: '#0F172A',
    bgColor: '#FFFFFF',
    dotType: 'square',
    cornerType: 'square',
    errorCorrectionLevel: 'Q'
  };

  // Configure PDF.js Worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // ==========================================
  // DOM ELEMENTS
  // ==========================================
  // Main Navigation Switcher
  const tabGenerate = document.getElementById('tabGenerate');
  const tabScan = document.getElementById('tabScan');
  const sectionGenerator = document.getElementById('section-generator');
  const sectionScanner = document.getElementById('section-scanner');

  // Generator Elements
  const qrCodeWrapper = document.getElementById('qrCodeWrapper');
  const typeBtns = document.querySelectorAll('.type-btn');
  const modeFields = document.querySelectorAll('.mode-fields');

  const qrColorPicker = document.getElementById('qrColorPicker');
  const qrColorHex = document.getElementById('qrColorHex');
  const bgColorPicker = document.getElementById('bgColorPicker');
  const bgColorHex = document.getElementById('bgColorHex');
  const resolutionSelect = document.getElementById('resolutionSelect');
  const dotStyleSelect = document.getElementById('dotStyleSelect');
  const cornerStyleSelect = document.getElementById('cornerStyleSelect');
  const logoUpload = document.getElementById('logoUpload');
  const removeLogoBtn = document.getElementById('removeLogoBtn');

  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const downloadSvgBtn = document.getElementById('downloadSvgBtn');
  const copyQrBtn = document.getElementById('copyQrBtn');

  // Scanner Elements
  const scanTabBtns = document.querySelectorAll('.scan-tab-btn');
  const scanViews = document.querySelectorAll('.scan-view');
  const photoDropZone = document.getElementById('photoDropZone');
  const scanPhotoInput = document.getElementById('scanPhotoInput');
  const pdfDropZone = document.getElementById('pdfDropZone');
  const scanPdfInput = document.getElementById('scanPdfInput');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');

  const scanTypeBadge = document.getElementById('scanTypeBadge');
  const scannedTextOutput = document.getElementById('scannedTextOutput');
  const scanActionsBar = document.getElementById('scanActionsBar');
  const openScannedLinkBtn = document.getElementById('openScannedLinkBtn');
  const copyScannedTextBtn = document.getElementById('copyScannedTextBtn');
  const clearScanBtn = document.getElementById('clearScanBtn');

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const toast = document.getElementById('toast');

  // ==========================================
  // INITIALIZATION
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    setupMainToolTabs();
    setupTypeSelector();
    setupColorPickers();
    setupEventListeners();
    setupTheme();
    setupScannerModules();
    initQrEngine();
  });

  // ==========================================
  // 1. TOOL SWITCHER (GENERATOR VS SCANNER)
  // ==========================================
  function setupMainToolTabs() {
    if (!tabGenerate || !tabScan) return;

    tabGenerate.addEventListener('click', () => {
      tabGenerate.classList.add('active');
      tabScan.classList.remove('active');
      sectionGenerator.style.display = 'block';
      sectionScanner.style.display = 'none';
      stopCamera();
    });

    tabScan.addEventListener('click', () => {
      tabScan.classList.add('active');
      tabGenerate.classList.remove('active');
      sectionScanner.style.display = 'block';
      sectionGenerator.style.display = 'none';
    });
  }

  // ==========================================
  // 2. QR ENGINE & GENERATOR LOGIC
  // ==========================================
  function initQrEngine() {
    if (typeof QRCodeStyling === 'undefined') {
      setTimeout(initQrEngine, 150);
      return;
    }

    qrCode = new QRCodeStyling({
      width: config.width,
      height: config.height,
      data: config.data,
      image: uploadedLogoUrl,
      dotsOptions: {
        color: config.qrColor,
        type: config.dotType
      },
      backgroundOptions: {
        color: config.bgColor
      },
      cornersSquareOptions: {
        type: config.cornerType,
        color: config.qrColor
      },
      cornersDotOptions: {
        type: config.cornerType === 'dot' ? 'dot' : 'square',
        color: config.qrColor
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 6,
        imageSize: 0.3
      },
      qrOptions: {
        errorCorrectionLevel: config.errorCorrectionLevel
      }
    });

    qrCodeWrapper.innerHTML = '';
    qrCode.append(qrCodeWrapper);
  }

  function updateQrCode() {
    const rawData = generatePayloadData();
    config.data = rawData || 'https://smartcalcpro.online';

    if (!qrCode) return;

    qrCode.update({
      data: config.data,
      image: uploadedLogoUrl,
      dotsOptions: {
        color: config.qrColor,
        type: config.dotType
      },
      backgroundOptions: {
        color: config.bgColor
      },
      cornersSquareOptions: {
        type: config.cornerType,
        color: config.qrColor
      },
      cornersDotOptions: {
        type: config.cornerType === 'dot' ? 'dot' : 'square',
        color: config.qrColor
      }
    });
  }

  function generatePayloadData() {
    switch (currentMode) {
      case 'url': {
        const url = document.getElementById('urlInput')?.value.trim();
        return url || 'https://smartcalcpro.online';
      }

      case 'phone': {
        const phone = document.getElementById('phoneInput')?.value.trim();
        const action = document.querySelector('input[name="phoneAction"]:checked')?.value || 'tel';
        if (!phone) return 'tel:+1234567890';
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        if (action === 'wa') return `https://wa.me/${cleanPhone.replace('+', '')}`;
        if (action === 'sms') return `SMSTO:${cleanPhone}:Hello`;
        return `tel:${cleanPhone}`;
      }

      case 'gstin': {
        const gstin = document.getElementById('gstinInput')?.value.trim().toUpperCase();
        const name = document.getElementById('businessName')?.value.trim();
        const inv = document.getElementById('invoiceNo')?.value.trim();
        if (!gstin) return 'GSTIN:27AAAAA0000A1Z5';
        let payload = `GSTIN:${gstin}`;
        if (name) payload += ` | Name:${name}`;
        if (inv) payload += ` | Inv:${inv}`;
        return payload;
      }

      case 'upi': {
        const vpa = document.getElementById('upiId')?.value.trim();
        const name = document.getElementById('payeeName')?.value.trim() || 'Merchant';
        const am = document.getElementById('upiAmount')?.value.trim();
        if (!vpa) return 'upi://pay?pa=merchant@upi&pn=Merchant&cu=INR';
        let upi = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}&cu=INR`;
        if (am && parseFloat(am) > 0) upi += `&am=${parseFloat(am).toFixed(2)}`;
        return upi;
      }

      case 'wifi': {
        const ssid = document.getElementById('wifiSsid')?.value.trim();
        const pass = document.getElementById('wifiPass')?.value || '';
        const type = document.getElementById('wifiType')?.value || 'WPA';
        if (!ssid) return 'WIFI:S:MyHome_WiFi;T:WPA;P:Password123;;';
        return `WIFI:S:${ssid};T:${type};P:${pass};;`;
      }

      case 'vcard': {
        const name = document.getElementById('vName')?.value.trim() || 'Contact';
        const phone = document.getElementById('vPhone')?.value.trim() || '';
        const email = document.getElementById('vEmail')?.value.trim() || '';
        const comp = document.getElementById('vCompany')?.value.trim() || '';
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${comp}\nEND:VCARD`;
      }

      case 'text': {
        return document.getElementById('textInput')?.value.trim() || 'Sample Text';
      }

      default:
        return 'https://smartcalcpro.online';
    }
  }

  function setupTypeSelector() {
    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.type;

        modeFields.forEach(f => {
          f.classList.toggle('active', f.id === `mode-${currentMode}`);
        });

        updateQrCode();
      });
    });
  }

  function setupColorPickers() {
    // QR Color
    qrColorPicker?.addEventListener('input', () => {
      qrColorHex.value = qrColorPicker.value.toUpperCase();
      config.qrColor = qrColorPicker.value;
      updateQrCode();
    });

    qrColorHex?.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(qrColorHex.value)) {
        qrColorPicker.value = qrColorHex.value;
        config.qrColor = qrColorHex.value;
        updateQrCode();
      }
    });

    // Background Color
    bgColorPicker?.addEventListener('input', () => {
      bgColorHex.value = bgColorPicker.value.toUpperCase();
      config.bgColor = bgColorPicker.value;
      updateQrCode();
    });

    bgColorHex?.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(bgColorHex.value)) {
        bgColorPicker.value = bgColorHex.value;
        config.bgColor = bgColorHex.value;
        updateQrCode();
      }
    });
  }

  function setupEventListeners() {
    // Listen to all inputs and textareas in config column
    const inputs = document.querySelectorAll('.config-column input, .config-column textarea, .config-column select');
    inputs.forEach(input => {
      input.addEventListener('input', updateQrCode);
      input.addEventListener('change', updateQrCode);
    });

    // Radio buttons for phone actions
    document.querySelectorAll('input[name="phoneAction"]').forEach(radio => {
      radio.addEventListener('change', updateQrCode);
    });

    // Styling selects
    dotStyleSelect?.addEventListener('change', () => {
      config.dotType = dotStyleSelect.value;
      updateQrCode();
    });

    cornerStyleSelect?.addEventListener('change', () => {
      config.cornerType = cornerStyleSelect.value;
      updateQrCode();
    });

    // Logo Upload
    logoUpload?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        uploadedLogoUrl = URL.createObjectURL(file);
        if (removeLogoBtn) removeLogoBtn.style.display = 'inline-block';
        updateQrCode();
        showToast('Logo attached to QR code!');
      }
    });

    removeLogoBtn?.addEventListener('click', () => {
      uploadedLogoUrl = null;
      if (logoUpload) logoUpload.value = '';
      removeLogoBtn.style.display = 'none';
      updateQrCode();
      showToast('Logo removed');
    });

    // Download & Clipboard Actions
    downloadPngBtn?.addEventListener('click', () => downloadQR('png'));
    downloadSvgBtn?.addEventListener('click', () => downloadQR('svg'));
    copyQrBtn?.addEventListener('click', copyQrToClipboard);
  }

  async function downloadQR(ext) {
    if (!qrCode) return;
    const res = parseInt(resolutionSelect?.value || '512', 10);
    showToast(`Generating ${res}x${res} ${ext.toUpperCase()} file...`);

    const tempQr = new QRCodeStyling({
      width: res,
      height: res,
      data: config.data,
      image: uploadedLogoUrl,
      dotsOptions: {
        color: config.qrColor,
        type: config.dotType
      },
      backgroundOptions: {
        color: config.bgColor
      },
      cornersSquareOptions: {
        type: config.cornerType,
        color: config.qrColor
      },
      cornersDotOptions: {
        type: config.cornerType === 'dot' ? 'dot' : 'square',
        color: config.qrColor
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: Math.round(res * 0.02),
        imageSize: 0.3
      },
      qrOptions: {
        errorCorrectionLevel: 'Q'
      }
    });

    await tempQr.download({
      name: `custom-qr-code-${Date.now()}`,
      extension: ext
    });

    showToast(`Downloaded QR Code (${ext.toUpperCase()})`);
  }

  async function copyQrToClipboard() {
    const canvas = qrCodeWrapper?.querySelector('canvas');
    if (!canvas) {
      showToast('QR canvas not ready');
      return;
    }

    try {
      canvas.toBlob(async (blob) => {
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          showToast('QR Code copied to clipboard!');
        } else {
          showToast('Clipboard not supported in this browser');
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      showToast('Could not copy QR code');
    }
  }

  // ==========================================
  // 3. DOCUMENT & PHOTO SCANNER MODULES
  // ==========================================
  function setupScannerModules() {
    // Mode switcher (Photo vs PDF vs Camera)
    scanTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        scanTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentScanMode = btn.dataset.scanmode;

        scanViews.forEach(v => {
          v.classList.toggle('active', v.id === `scan-view-${currentScanMode}`);
        });

        if (currentScanMode !== 'camera') {
          stopCamera();
        }
      });
    });

    // 1. Photo Drag-and-Drop & File Input
    if (photoDropZone && scanPhotoInput) {
      ['dragenter', 'dragover'].forEach(eventName => {
        photoDropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          photoDropZone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        photoDropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          photoDropZone.classList.remove('dragover');
        });
      });

      photoDropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
          scanImageFile(files[0]);
        } else {
          showToast('Please drop a valid image file');
        }
      });

      scanPhotoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          scanImageFile(e.target.files[0]);
        }
      });

      // Paste image support (Ctrl+V)
      window.addEventListener('paste', (e) => {
        if (sectionScanner.style.display !== 'none' && currentScanMode === 'upload') {
          const items = e.clipboardData?.items;
          if (items) {
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                scanImageFile(blob);
                break;
              }
            }
          }
        }
      });
    }

    // 2. PDF Drag-and-Drop & File Input
    if (pdfDropZone && scanPdfInput) {
      ['dragenter', 'dragover'].forEach(eventName => {
        pdfDropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          pdfDropZone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        pdfDropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          pdfDropZone.classList.remove('dragover');
        });
      });

      pdfDropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
          scanPdfFile(files[0]);
        } else {
          showToast('Please drop a valid PDF document');
        }
      });

      scanPdfInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          scanPdfFile(e.target.files[0]);
        }
      });
    }

    // 3. Live Camera Controls
    startCameraBtn?.addEventListener('click', startCamera);
    stopCameraBtn?.addEventListener('click', stopCamera);

    // 4. Scanned Result Action Buttons
    copyScannedTextBtn?.addEventListener('click', () => {
      if (!currentScannedData) return;
      navigator.clipboard.writeText(currentScannedData).then(() => {
        showToast('Decoded text copied to clipboard!');
      });
    });

    openScannedLinkBtn?.addEventListener('click', () => {
      if (currentScannedData && (currentScannedData.startsWith('http://') || currentScannedData.startsWith('https://'))) {
        window.open(currentScannedData, '_blank', 'noopener,noreferrer');
      }
    });

    clearScanBtn?.addEventListener('click', () => {
      currentScannedData = '';
      scannedTextOutput.innerHTML = '<span class="placeholder-text">Upload a photo, PDF document, or start camera to scan QR code content...</span>';
      scanTypeBadge.className = 'scan-badge';
      scanTypeBadge.textContent = 'Waiting for Scan...';
      scanActionsBar.style.display = 'none';
      openScannedLinkBtn.style.display = 'none';
    });
  }

  // --- Photo QR Scanning Engine ---
  function scanImageFile(file) {
    showToast('Analyzing image for QR code...');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = null;

        if (window.jsQR) {
          code = window.jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth'
          });
        }

        if (code && code.data) {
          displayScannedResult(code.data, 'Photo / Image Scan');
          showToast('QR Code successfully decoded!');
        } else {
          showToast('No QR code detected in this photo. Please try a clearer image.');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- PDF QR Scanning Engine ---
  async function scanPdfFile(file) {
    if (!window.pdfjsLib) {
      showToast('PDF decoder is loading, please try again in a second...');
      return;
    }

    showToast('Processing PDF pages for QR codes & invoices...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let foundCodes = [];

      for (let pageNum = 1; pageNum <= Math.min(numPages, 15); pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // High scale for crisp QR code detection

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (window.jsQR) {
          const code = window.jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth'
          });

          if (code && code.data) {
            foundCodes.push(`[Page ${pageNum}]: ${code.data}`);
          }
        }
      }

      if (foundCodes.length > 0) {
        displayScannedResult(foundCodes.join('\n\n'), `PDF Document (${foundCodes.length} QR Code(s) Found)`);
        showToast(`Found ${foundCodes.length} QR code(s) in PDF!`);
      } else {
        showToast('No QR code detected in the uploaded PDF document pages.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error reading PDF document.');
    }
  }

  // --- Live Camera QR Scanner ---
  function startCamera() {
    if (typeof Html5Qrcode === 'undefined') {
      showToast('Camera scanner library loading, please retry...');
      return;
    }

    if (isCameraScanning) return;

    html5QrScanner = new Html5Qrcode('reader');
    const qrConfig = { fps: 15, qrbox: { width: 260, height: 260 } };

    html5QrScanner.start(
      { facingMode: 'environment' },
      qrConfig,
      (decodedText) => {
        displayScannedResult(decodedText, 'Live Camera Scan');
        showToast('QR Code detected!');
        stopCamera();
      },
      () => {
        // Continuous scan loop frame ignore
      }
    ).then(() => {
      isCameraScanning = true;
      if (startCameraBtn) startCameraBtn.style.display = 'none';
      if (stopCameraBtn) stopCameraBtn.style.display = 'inline-flex';
      showToast('Camera active. Point at a QR code.');
    }).catch(err => {
      console.error(err);
      showToast('Camera access denied or camera not found.');
    });
  }

  function stopCamera() {
    if (html5QrScanner && isCameraScanning) {
      html5QrScanner.stop().then(() => {
        html5QrScanner.clear();
        isCameraScanning = false;
        if (startCameraBtn) startCameraBtn.style.display = 'inline-flex';
        if (stopCameraBtn) stopCameraBtn.style.display = 'none';
      }).catch(err => {
        console.error(err);
        isCameraScanning = false;
      });
    }
  }

  // --- Scanned Result Presenter ---
  function displayScannedResult(data, sourceLabel) {
    currentScannedData = data;
    scannedTextOutput.textContent = data;

    // Determine type
    let badgeText = sourceLabel || 'Decoded';
    if (data.startsWith('http://') || data.startsWith('https://')) {
      badgeText = 'Website URL';
      openScannedLinkBtn.style.display = 'inline-flex';
    } else if (data.startsWith('GSTIN:') || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/.test(data)) {
      badgeText = 'GSTIN / Invoice Data';
      openScannedLinkBtn.style.display = 'none';
    } else if (data.startsWith('upi://') || data.includes('pa=')) {
      badgeText = 'UPI Payment';
      openScannedLinkBtn.style.display = 'none';
    } else if (data.startsWith('tel:') || data.startsWith('SMSTO:') || data.includes('wa.me/')) {
      badgeText = 'Phone / Contact';
      openScannedLinkBtn.style.display = 'none';
    } else if (data.startsWith('WIFI:')) {
      badgeText = 'Wi-Fi Credentials';
      openScannedLinkBtn.style.display = 'none';
    } else if (data.startsWith('BEGIN:VCARD')) {
      badgeText = 'vCard Contact Card';
      openScannedLinkBtn.style.display = 'none';
    } else {
      openScannedLinkBtn.style.display = 'none';
    }

    scanTypeBadge.className = 'scan-badge success';
    scanTypeBadge.textContent = badgeText;
    scanActionsBar.style.display = 'flex';
  }

  // ==========================================
  // 4. UTILITIES & THEME
  // ==========================================
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function setupTheme() {
    const savedTheme = localStorage.getItem('qr-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggleBtn) {
      themeToggleBtn.querySelector('i').className = savedTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      themeToggleBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('qr-theme', next);
        themeToggleBtn.querySelector('i').className = next === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      });
    }
  }

})();
