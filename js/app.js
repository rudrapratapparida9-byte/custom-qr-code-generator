/**
 * Custom QR Code Generator Engine
 * Generates instant QR codes for URLs, GSTIN Invoices, UPI Payments,
 * Phone/WhatsApp, Wi-Fi Networks, vCard Contacts & Plain Text.
 */

(function () {
  'use strict';

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let qrCode = null;
  let currentMode = 'url';
  let uploadedLogoUrl = null;

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

  // ==========================================
  // DOM ELEMENTS
  // ==========================================
  const qrCodeWrapper = document.getElementById('qrCodeWrapper');
  const typeBtns = document.querySelectorAll('.type-btn');
  const modeFields = document.querySelectorAll('.mode-fields');

  // Colors & Customizations
  const qrColorPicker = document.getElementById('qrColorPicker');
  const qrColorHex = document.getElementById('qrColorHex');
  const bgColorPicker = document.getElementById('bgColorPicker');
  const bgColorHex = document.getElementById('bgColorHex');
  const resolutionSelect = document.getElementById('resolutionSelect');
  const dotStyleSelect = document.getElementById('dotStyleSelect');
  const cornerStyleSelect = document.getElementById('cornerStyleSelect');
  const logoUpload = document.getElementById('logoUpload');
  const removeLogoBtn = document.getElementById('removeLogoBtn');

  // Actions
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const downloadSvgBtn = document.getElementById('downloadSvgBtn');
  const copyQrBtn = document.getElementById('copyQrBtn');

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const toast = document.getElementById('toast');

  // ==========================================
  // INITIALIZATION
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    setupTypeSelector();
    setupColorPickers();
    setupEventListeners();
    setupTheme();
    initQrEngine();
  });

  // ==========================================
  // 1. QR ENGINE LOGIC
  // ==========================================
  function initQrEngine() {
    if (typeof QRCodeStyling === 'undefined') {
      setTimeout(initQrEngine, 150);
      return;
    }

    config.data = generatePayloadData();

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

      case 'phone': {
        const phone = document.getElementById('phoneInput')?.value.trim();
        const action = document.querySelector('input[name="phoneAction"]:checked')?.value || 'tel';
        if (!phone) return 'tel:+919876543210';
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        if (action === 'wa') return `https://wa.me/${cleanPhone.replace('+', '')}`;
        if (action === 'sms') return `SMSTO:${cleanPhone}:Hello`;
        return `tel:${cleanPhone}`;
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
        return document.getElementById('textInput')?.value.trim() || 'Sample Text / Serial Number';
      }

      default:
        return 'https://smartcalcpro.online';
    }
  }

  // ==========================================
  // 2. CATEGORY MODE SELECTOR
  // ==========================================
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

  // ==========================================
  // 3. COLORS, CUSTOMIZATIONS & EVENTS
  // ==========================================
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
    const inputs = document.querySelectorAll('.config-column input, .config-column textarea, .config-column select');
    inputs.forEach(input => {
      input.addEventListener('input', updateQrCode);
      input.addEventListener('change', updateQrCode);
    });

    document.querySelectorAll('input[name="phoneAction"]').forEach(radio => {
      radio.addEventListener('change', updateQrCode);
    });

    dotStyleSelect?.addEventListener('change', () => {
      config.dotType = dotStyleSelect.value;
      updateQrCode();
    });

    cornerStyleSelect?.addEventListener('change', () => {
      config.cornerType = cornerStyleSelect.value;
      updateQrCode();
    });

    logoUpload?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        uploadedLogoUrl = URL.createObjectURL(file);
        if (removeLogoBtn) removeLogoBtn.style.display = 'inline-block';
        updateQrCode();
        showToast('Logo centered on QR code!');
      }
    });

    removeLogoBtn?.addEventListener('click', () => {
      uploadedLogoUrl = null;
      if (logoUpload) logoUpload.value = '';
      removeLogoBtn.style.display = 'none';
      updateQrCode();
      showToast('Center logo removed');
    });

    downloadPngBtn?.addEventListener('click', () => downloadQR('png'));
    downloadSvgBtn?.addEventListener('click', () => downloadQR('svg'));
    copyQrBtn?.addEventListener('click', copyQrToClipboard);
  }

  async function downloadQR(ext) {
    if (!qrCode) return;
    const res = parseInt(resolutionSelect?.value || '512', 10);
    showToast(`Generating ${res}x${res} ${ext.toUpperCase()} QR image...`);

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
      name: `custom-qr-${currentMode}-${Date.now()}`,
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
