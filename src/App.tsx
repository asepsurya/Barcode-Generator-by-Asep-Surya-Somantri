import React, { useState, useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import type {
  Options,
  DrawType,
  TypeNumber,
  Mode,
  ErrorCorrectionLevel,
  DotType,
  CornerSquareType,
  CornerDotType
} from 'qr-code-styling';
import {
  Download,
  RotateCcw,
  Plus,
  Link,
  Loader2
} from 'lucide-react';

const INITIAL_OPTIONS: Options = {
  width: 300,
  height: 300,
  type: 'svg' as DrawType,
  data: 'https://www.scrollwebid.com/',
  image: '/Logo.png',
  margin: 15,
  qrOptions: {
    typeNumber: 0 as TypeNumber,
    mode: 'Byte' as Mode,
    errorCorrectionLevel: 'Q' as ErrorCorrectionLevel
  },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.5,
    margin: 3,
    crossOrigin: 'anonymous',
  },
  dotsOptions: {
    color: '#1a1d1f',
    type: 'dots' as DotType
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  cornersSquareOptions: {
    color: '#1a1d1f',
    type: 'square' as CornerSquareType
  },
  cornersDotOptions: {
    color: '#1a1d1f',
    type: 'square' as CornerDotType
  }
};

const DOT_STYLES: { label: string; value: DotType; icon: string }[] = [
  { label: 'Square', value: 'square', icon: '/square.svg' },
  { label: 'Dots', value: 'dots', icon: '/dots.svg' },
  { label: 'Rounded', value: 'rounded', icon: '/rounded-1.svg' },
  { label: 'Extra Rounded', value: 'extra-rounded', icon: '/rounded-2.svg' },
  { label: 'Classy Rounded', value: 'classy-rounded', icon: '/connect-horizontal.svg' },
  { label: 'Classy', value: 'classy', icon: '/default.svg' }
];

const CORNER_STYLES: { label: string; outerType: CornerSquareType; innerType: CornerDotType; icon: string }[] = [
  { label: 'Square', outerType: 'square', innerType: 'square', icon: '/corner/version-1.svg' },
  { label: 'Dot', outerType: 'dot', innerType: 'dot', icon: '/corner/version-9.svg' },
  { label: 'Classy', outerType: 'classy', innerType: 'square', icon: '/corner/version-10.svg' },
  { label: 'Extra-Rounded', outerType: 'extra-rounded', innerType: 'dot', icon: '/corner/version-11.svg' },
  { label: 'Classy-Rounded', outerType: 'classy-rounded', innerType: 'square', icon: '/corner/version-13.svg' },
  { label: 'Dots', outerType: 'dots', innerType: 'dots', icon: '/corner/version-15.svg' },
  { label: 'Star / Jagged', outerType: 'classy', innerType: 'dot', icon: '/corner/version-16.svg' },
  { label: 'Soft Square', outerType: 'rounded', innerType: 'rounded', icon: '/corner/version-17.svg' }
];

const PRESET_LOGOS = [
  { label: 'Scan Me 1', icon: '/logo_default/icon-generator-scan-me-1.svg' },
  { label: 'Scan Me 2', icon: '/logo_default/icon-generator-scan-me-2.svg' },
  { label: 'Website', icon: '/logo_default/icon-generator-website-2.svg' }
];

export default function App() {
  const [options, setOptions] = useState<Options>(INITIAL_OPTIONS);
  const [data, setData] = useState(INITIAL_OPTIONS.data || '');
  const [userLogos, setUserLogos] = useState<{ label: string; icon: string }[]>([]);
  const [isShortening, setIsShortening] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling>(new QRCodeStyling(INITIAL_OPTIONS));

  const isUrl = /^https?:\/\/.+/i.test(data.trim());

  const shortenUrl = async () => {
    if (!isUrl) return;
    setIsShortening(true);
    try {
      const response = await fetch(`/api/shorten?url=${encodeURIComponent(data.trim())}`);
      if (!response.ok) throw new Error('Shortening failed');
      const result = await response.json();
      if (result.shortUrl) {
        setData(result.shortUrl);
        updateOption('data', result.shortUrl);
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to shorten URL:', error);
      alert(error.message || 'Failed to shorten URL. Please try again.');
    } finally {
      setIsShortening(false);
    }
  };

  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.current.append(qrRef.current);
      qrCode.current.update(options);
    }
  }, []);

  useEffect(() => {
    // Debounce to prevent flicker when dragging color pickers
    const timer = setTimeout(() => {
      qrCode.current.update(options);
    }, 50);
    return () => clearTimeout(timer);
  }, [options]);

  const handleDownload = async (ext: 'png' | 'svg') => {
    // Scale factor for HD (e.g., 300px -> 2400px is exactly 8x scale)
    const scale = 8;
    const currentOptions = { ...options };

    const hdOptions: Options = {
      ...options,
      width: (options.width || 300) * scale,
      height: (options.height || 300) * scale,
      margin: (options.margin || 10) * scale,
    };

    // Scale image margin if it exists
    if (hdOptions.imageOptions) {
      hdOptions.imageOptions = {
        ...hdOptions.imageOptions,
        margin: (hdOptions.imageOptions.margin || 0) * scale,
      };
    }

    // Update existing instance for identical rendering and wait a tiny bit for render
    qrCode.current.update(hdOptions);
    await new Promise(r => setTimeout(r, 100)); // 100ms render tick
    await qrCode.current.download({ extension: ext, name: `qr-code-hd` });

    // Restore size
    qrCode.current.update(currentOptions);
  };

  const updateOption = (path: string, value: any) => {
    setOptions(prev => {
      const keys = path.split('.');
      const newOptions = { ...prev };
      let current: any = newOptions;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newOptions;
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const newLogo = { label: `Custom ${userLogos.length + 1}`, icon: result };
        setUserLogos(prev => [...prev, newLogo]);
        updateOption('image', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const allLogos = [...PRESET_LOGOS, ...userLogos];

  return (
    <div className="layout">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-logo">
          <img src="/Logo.png" alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        <div className="topbar-actions" style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary topbar-btn" onClick={() => {
            setOptions(INITIAL_OPTIONS);
            setData(INITIAL_OPTIONS.data || '');
          }}>
            <RotateCcw size={18} /> <span className="hide-on-mobile">Reset Design</span>
          </button>
          <button className="btn-primary topbar-btn" onClick={() => handleDownload('png')}>
            <Download size={18} /> <span className="hide-on-mobile">Download QR</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-fluid">
        <div className="main-wrapper">
          <section className="header-section">
            <h1>Create Your Professional QR</h1>
            <p>Customize every detail of your QR code to match your branding perfectly.</p>
          </section>

          <section className="section-box">
            <h3>QR Customization Studio</h3>

            <div className="customizer-layout">
              <div className="config-panel">
                {/* Content Input */}
                <div className="config-group">
                  <label className="config-label">Target Content (URL or Text)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      value={data}
                      onChange={(e) => {
                        setData(e.target.value);
                        updateOption('data', e.target.value);
                      }}
                      placeholder="https://example.com"
                    />
                    <button
                      className="btn-secondary"
                      style={{
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        opacity: (isShortening || !isUrl) ? 0.6 : 1,
                        cursor: (isShortening || !isUrl) ? 'not-allowed' : 'pointer',
                        pointerEvents: (isShortening || !isUrl) ? 'none' : 'auto'
                      }}
                      onClick={shortenUrl}
                      disabled={isShortening || !isUrl}
                    >
                      {isShortening ? <Loader2 size={18} className="animate-spin" /> : <Link size={18} />}
                      Shorten
                    </button>
                  </div>
                </div>

                {/* Shapes */}
                <div className="config-group">
                  <label className="config-label">Body Pattern Shape</label>
                  <div className="icon-grid">
                    {DOT_STYLES.map(style => (
                      <div
                        key={style.label}
                        className={`icon-item ${options.dotsOptions?.type === style.value ? 'active' : ''}`}
                        onClick={() => updateOption('dotsOptions.type', style.value)}
                        title={style.label}
                      >
                        <img src={style.icon} alt={style.label} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corners */}
                <div className="config-group">
                  <label className="config-label">Corner Style (Outer & Inner)</label>
                  <div className="icon-grid">
                    {CORNER_STYLES.map(style => (
                      <div
                        key={style.label}
                        className={`icon-item ${options.cornersSquareOptions?.type === style.outerType && options.cornersDotOptions?.type === style.innerType ? 'active' : ''}`}
                        onClick={() => {
                          updateOption('cornersSquareOptions.type', style.outerType);
                          updateOption('cornersDotOptions.type', style.innerType);
                        }}
                        title={style.label}
                      >
                        <img src={style.icon} alt={style.label} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logo Section */}
                <div className="config-group">
                  <label className="config-label">Add Your Branding (Logo)</label>
                  <div className="icon-grid" style={{ marginBottom: '12px' }}>
                    {allLogos.map((logo, idx) => (
                      <div
                        key={`${logo.label}-${idx}`}
                        className={`icon-item logo-item ${options.image === logo.icon ? 'active' : ''}`}
                        onClick={() => updateOption('image', logo.icon)}
                        title={logo.label}
                      >
                        <img src={logo.icon} alt={logo.label} />
                      </div>
                    ))}
                    <label className="icon-item" style={{ cursor: 'pointer', borderStyle: 'dashed' }}>
                      <Plus size={24} color="var(--primary)" />
                      <input type="file" hidden onChange={handleLogoUpload} accept="image/*" />
                    </label>
                    {options.image && (
                      <button className="icon-item" style={{ borderStyle: 'dashed' }} onClick={() => updateOption('image', '')} title="Remove Logo">
                        <RotateCcw size={20} color="var(--text-muted)" />
                      </button>
                    )}
                  </div>

                  {options.image && (
                    <div className="responsive-grid" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
                      <div>
                        <div className="config-label" style={{ fontSize: '13px', marginBottom: '8px' }}>Logo Size ({Math.round((options.imageOptions?.imageSize || 0) * 100)}%)</div>
                        <input
                          type="range" min="0.1" max="0.5" step="0.05"
                          value={options.imageOptions?.imageSize}
                          onChange={(e) => updateOption('imageOptions.imageSize', parseFloat(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--primary)' }}
                        />
                      </div>
                      <div>
                        <div className="config-label" style={{ fontSize: '13px', marginBottom: '8px' }}>Logo Safe Zone ({options.imageOptions?.margin}px)</div>
                        <input
                          type="range" min="0" max="40" step="5"
                          value={options.imageOptions?.margin}
                          onChange={(e) => updateOption('imageOptions.margin', parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--primary)' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Spacing & Layout */}
                <div className="config-group">
                  <label className="config-label">Outer Padding (Quiet Zone)</label>
                  <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>
                      <span>QR Code Margin</span>
                      <span>{options.margin}px</span>
                    </div>
                    <input
                      type="range" min="0" max="50" step="5"
                      value={options.margin}
                      onChange={(e) => updateOption('margin', parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="responsive-grid">
                  <div className="config-group">
                    <label className="config-label">Primary Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <input type="color" style={{ width: '32px', height: '32px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }} value={options.dotsOptions?.color} onChange={e => {
                        updateOption('dotsOptions.color', e.target.value);
                        updateOption('cornersSquareOptions.color', e.target.value);
                        updateOption('cornersDotOptions.color', e.target.value);
                      }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}>{options.dotsOptions?.color?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="config-group">
                    <label className="config-label">Background Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <input type="color" style={{ width: '32px', height: '32px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }} value={options.backgroundOptions?.color} onChange={e => updateOption('backgroundOptions.color', e.target.value)} />
                      <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}>{options.backgroundOptions?.color?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="preview-sticky">
                <div className="qr-card">
                  <div ref={qrRef} style={{ background: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 12px 24px -6px rgba(0,0,0,0.1)' }}></div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>QR Preview</p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Scan with your phone to test</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main >
    </div >
  );
}
