import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import './App.css';

interface Template {
  id: number;
  name: string;
  platform: string;
  dimensions: string;
  description: string;
}

interface AdContent {
  // Standard social media ad format
  headline?: string;
  copy?: string;
  cta?: string;
  hashtags?: string[];

  // YouTube video script format
  hook?: string;
  problem?: string;
  solution?: string;

  // Amazon product listing format
  title?: string;
  bullets?: string[];
  description?: string;
  keywords?: string[];

  // Added from backend
  adsRemaining?: number;
}

export default function Home() {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState('');
  const [platform, setPlatform] = useState('Facebook/Instagram/Pinterest');
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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      // Add auth token if user is logged in
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers,
        body: JSON.stringify({ product, platform, tone, targetAudience })
      });

      const data = await response.json();

      if (response.ok) {
        setAdContent(data);

        // Refresh user profile to get updated ads_remaining
        if (currentUser) {
          await refreshUserProfile();
        }
      } else {
        if (response.status === 403) {
          // Out of ads
          alert(data.message || 'No ads remaining. Please upgrade your plan or purchase more ads.');
          navigate('/pricing');
        } else if (response.status === 401) {
          // Not logged in and no free tier
          alert('Please sign in to generate ads');
          navigate('/login');
        } else {
          alert(data.error || 'Failed to generate ad');
        }
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

              {userProfile && (
                <div className="user-credits-banner">
                  Ads remaining: <strong>{userProfile.ads_remaining === 999999 ? '∞' : userProfile.ads_remaining}</strong>
                </div>
              )}

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
                    <option>Facebook/Instagram/Pinterest</option>
                    <option>YouTube</option>
                    <option>Amazon</option>
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
                <h2>Your Generated {platform?.includes('YouTube') ? 'Video Script' : platform?.includes('Amazon') ? 'Product Listing' : 'Ad'} 🎉</h2>

                <div className="ad-preview">
                  {/* YouTube Video Script Format */}
                  {adContent.hook && (
                    <>
                      <div className="ad-section">
                        <div className="ad-label">🎬 Hook (0-3s)</div>
                        <div className="ad-content">{adContent.hook}</div>
                        <button onClick={() => copyToClipboard(adContent.hook!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <div className="ad-section">
                        <div className="ad-label">⚠️ Problem (3-8s)</div>
                        <div className="ad-content">{adContent.problem}</div>
                        <button onClick={() => copyToClipboard(adContent.problem!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <div className="ad-section">
                        <div className="ad-label">✅ Solution (8-20s)</div>
                        <div className="ad-content">{adContent.solution}</div>
                        <button onClick={() => copyToClipboard(adContent.solution!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <div className="ad-section">
                        <div className="ad-label">🎯 Call-to-Action (20-30s)</div>
                        <div className="ad-content cta">{adContent.cta}</div>
                        <button onClick={() => copyToClipboard(adContent.cta!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <button
                        onClick={() => {
                          const fullScript = `HOOK (0-3s):\n${adContent.hook}\n\nPROBLEM (3-8s):\n${adContent.problem}\n\nSOLUTION (8-20s):\n${adContent.solution}\n\nCTA (20-30s):\n${adContent.cta}`;
                          copyToClipboard(fullScript);
                        }}
                        className="copy-all-btn"
                      >
                        📋 Copy Full Script
                      </button>
                    </>
                  )}

                  {/* Amazon Product Listing Format */}
                  {adContent.title && (
                    <>
                      <div className="ad-section">
                        <div className="ad-label">📦 Product Title</div>
                        <div className="ad-content">{adContent.title}</div>
                        <button onClick={() => copyToClipboard(adContent.title!)} className="copy-btn">📋 Copy</button>
                      </div>

                      {adContent.bullets && adContent.bullets.length > 0 && (
                        <div className="ad-section">
                          <div className="ad-label">⭐ Key Features (Bullets)</div>
                          <div className="ad-content">
                            <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                              {adContent.bullets.map((bullet, idx) => (
                                <li key={idx}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                          <button onClick={() => copyToClipboard(adContent.bullets!.join('\n• '))} className="copy-btn">📋 Copy</button>
                        </div>
                      )}

                      <div className="ad-section">
                        <div className="ad-label">📝 Product Description</div>
                        <div className="ad-content">{adContent.description}</div>
                        <button onClick={() => copyToClipboard(adContent.description!)} className="copy-btn">📋 Copy</button>
                      </div>

                      {adContent.keywords && adContent.keywords.length > 0 && (
                        <div className="ad-section">
                          <div className="ad-label">🔍 SEO Keywords</div>
                          <div className="ad-content hashtags">{adContent.keywords.join(', ')}</div>
                          <button onClick={() => copyToClipboard(adContent.keywords!.join(', '))} className="copy-btn">📋 Copy</button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const fullListing = `TITLE:\n${adContent.title}\n\nBULLET POINTS:\n• ${adContent.bullets?.join('\n• ')}\n\nDESCRIPTION:\n${adContent.description}\n\nKEYWORDS:\n${adContent.keywords?.join(', ')}`;
                          copyToClipboard(fullListing);
                        }}
                        className="copy-all-btn"
                      >
                        📋 Copy Full Listing
                      </button>
                    </>
                  )}

                  {/* Standard Social Media Ad Format */}
                  {adContent.headline && !adContent.hook && !adContent.title && (
                    <>
                      <div className="ad-section">
                        <div className="ad-label">📌 Headline</div>
                        <div className="ad-content">{adContent.headline}</div>
                        <button onClick={() => copyToClipboard(adContent.headline!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <div className="ad-section">
                        <div className="ad-label">📝 Ad Copy</div>
                        <div className="ad-content">{adContent.copy}</div>
                        <button onClick={() => copyToClipboard(adContent.copy!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <div className="ad-section">
                        <div className="ad-label">🎯 Call-to-Action</div>
                        <div className="ad-content cta">{adContent.cta}</div>
                        <button onClick={() => copyToClipboard(adContent.cta!)} className="copy-btn">📋 Copy</button>
                      </div>

                      {adContent.hashtags && adContent.hashtags.length > 0 && (
                        <div className="ad-section">
                          <div className="ad-label">#️⃣ Hashtags</div>
                          <div className="ad-content hashtags">
                            {Array.isArray(adContent.hashtags) ? adContent.hashtags.join(' ') : adContent.hashtags}
                          </div>
                          <button onClick={() => copyToClipboard(Array.isArray(adContent.hashtags) ? adContent.hashtags.join(' ') : String(adContent.hashtags))} className="copy-btn">
                            📋 Copy
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const fullAd = `${adContent.headline}\n\n${adContent.copy}\n\n${adContent.cta}\n\n${Array.isArray(adContent.hashtags) ? adContent.hashtags.join(' ') : adContent.hashtags}`;
                          copyToClipboard(fullAd);
                        }}
                        className="copy-all-btn"
                      >
                        📋 Copy Full Ad
                      </button>
                    </>
                  )}
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
