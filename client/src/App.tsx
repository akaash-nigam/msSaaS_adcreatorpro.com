import { useState, useEffect } from 'react';
import './App.css';

interface Template {
  id: number;
  name: string;
  platform: string;
  dimensions: string;
  description: string;
}

interface AdContent {
  headline: string;
  copy: string;
  cta: string;
  hashtags: string[];
}

function App() {
  const [product, setProduct] = useState('');
  const [platform, setPlatform] = useState('Facebook/Instagram');
  const [tone, setTone] = useState('Professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [adContent, setAdContent] = useState<AdContent | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'templates'>('generate');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const generateAd = async () => {
    if (!product.trim()) {
      alert('Please enter a product or service description');
      return;
    }

    setLoading(true);
    setAdContent(null);

    try {
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, platform, tone, targetAudience })
      });

      const data = await response.json();

      if (response.ok) {
        setAdContent(data);
      } else {
        alert(data.error || 'Failed to generate ad');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate ad. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎨 AdCreatorPro</h1>
        <p>AI-Powered Advertisement Creation</p>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          ✨ Generate Ad
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📋 Templates
        </button>
      </div>

      <main className="main">
        {activeTab === 'generate' && (
          <div className="generate-section">
            <div className="form-container">
              <h2>Create Your Advertisement</h2>

              <div className="form-group">
                <label>Product/Service Description *</label>
                <textarea
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Describe your product or service... (e.g., 'Premium organic coffee beans sourced from Colombia')"
                  rows={4}
                  className="input textarea"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="input select"
                  >
                    <option>Facebook/Instagram</option>
                    <option>Google Ads</option>
                    <option>LinkedIn</option>
                    <option>Twitter/X</option>
                    <option>TikTok</option>
                    <option>General</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="input select"
                  >
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Friendly</option>
                    <option>Urgent</option>
                    <option>Luxury</option>
                    <option>Playful</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Target Audience (Optional)</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., 'Coffee enthusiasts aged 25-45'"
                  className="input"
                />
              </div>

              <button
                onClick={generateAd}
                disabled={loading}
                className="generate-btn"
              >
                {loading ? '✨ Generating...' : '🚀 Generate Ad'}
              </button>
            </div>

            {adContent && (
              <div className="result-container">
                <h2>Your Generated Ad 🎉</h2>

                <div className="ad-preview">
                  <div className="ad-section">
                    <div className="ad-label">📌 Headline</div>
                    <div className="ad-content">{adContent.headline}</div>
                    <button
                      onClick={() => copyToClipboard(adContent.headline)}
                      className="copy-btn"
                    >
                      📋 Copy
                    </button>
                  </div>

                  <div className="ad-section">
                    <div className="ad-label">📝 Ad Copy</div>
                    <div className="ad-content">{adContent.copy}</div>
                    <button
                      onClick={() => copyToClipboard(adContent.copy)}
                      className="copy-btn"
                    >
                      📋 Copy
                    </button>
                  </div>

                  <div className="ad-section">
                    <div className="ad-label">🎯 Call-to-Action</div>
                    <div className="ad-content cta">{adContent.cta}</div>
                    <button
                      onClick={() => copyToClipboard(adContent.cta)}
                      className="copy-btn"
                    >
                      📋 Copy
                    </button>
                  </div>

                  {adContent.hashtags && adContent.hashtags.length > 0 && (
                    <div className="ad-section">
                      <div className="ad-label">#️⃣ Hashtags</div>
                      <div className="ad-content hashtags">
                        {Array.isArray(adContent.hashtags)
                          ? adContent.hashtags.join(' ')
                          : adContent.hashtags}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            Array.isArray(adContent.hashtags)
                              ? adContent.hashtags.join(' ')
                              : adContent.hashtags
                          )
                        }
                        className="copy-btn"
                      >
                        📋 Copy
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const fullAd = `${adContent.headline}\n\n${adContent.copy}\n\n${adContent.cta}\n\n${
                        Array.isArray(adContent.hashtags)
                          ? adContent.hashtags.join(' ')
                          : adContent.hashtags
                      }`;
                      copyToClipboard(fullAd);
                    }}
                    className="copy-all-btn"
                  >
                    📋 Copy Full Ad
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-section">
            <h2>Ad Templates by Platform</h2>
            <p className="templates-desc">
              Choose the perfect format for your advertising campaign
            </p>

            <div className="templates-grid">
              {templates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <h3>{template.name}</h3>
                    <span className="platform-badge">{template.platform}</span>
                  </div>
                  <p className="template-desc">{template.description}</p>
                  <div className="template-dimensions">
                    📐 {template.dimensions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          Made with ❤️ by AdCreatorPro | Powered by AI
        </p>
      </footer>
    </div>
  );
}

export default App;
