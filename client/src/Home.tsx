import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from './components/Toast';
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

interface BrandProfile {
  id: string;
  name: string;
  industry?: string;
  description?: string;
  target_audience?: string;
  brand_voice?: string;
  keywords?: string[];
  example_content?: string;
  website_url?: string;
  is_default: boolean;
}

interface GenerateResponse {
  variations?: AdContent[];
  count?: number;
  adsRemaining?: number;
  // Legacy single ad support
  headline?: string;
  copy?: string;
  cta?: string;
  hashtags?: string[];
  hook?: string;
  problem?: string;
  solution?: string;
  title?: string;
  bullets?: string[];
  description?: string;
  keywords?: string[];
}

export default function Home() {
  const { currentUser, userProfile, refreshUserProfile, getIdToken } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [product, setProduct] = useState('');
  const [platform, setPlatform] = useState('Facebook/Instagram/Pinterest');
  const [tone, setTone] = useState('Professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [adVariations, setAdVariations] = useState<AdContent[]>([]);
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'templates'>('generate');
  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [variationsCount, setVariationsCount] = useState(3);

  useEffect(() => {
    fetchTemplates();
    if (currentUser) {
      fetchBrandProfiles();
    }
  }, [currentUser]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchBrandProfiles = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch('/api/brand-profiles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const profiles = await response.json();
        setBrandProfiles(profiles);

        // Auto-select default brand if exists
        const defaultProfile = profiles.find((p: BrandProfile) => p.is_default);
        if (defaultProfile) {
          setSelectedBrand(defaultProfile.id);
          handleBrandChange(defaultProfile.id, profiles);
        }
      }
    } catch (error) {
      console.error('Error fetching brand profiles:', error);
    }
  };

  const handleBrandChange = (brandId: string, profiles = brandProfiles) => {
    setSelectedBrand(brandId);

    if (brandId) {
      const brand = profiles.find(p => p.id === brandId);
      if (brand) {
        // Auto-fill form fields from brand profile
        if (brand.target_audience && !targetAudience) {
          setTargetAudience(brand.target_audience);
        }
        if (brand.brand_voice && tone === 'Professional') {
          setTone(brand.brand_voice);
        }
      }
    }
  };

  const generateAd = async () => {
    if (!product.trim()) {
      toast.warning('Please enter a product or service description');
      return;
    }

    setLoading(true);
    setAdVariations([]);
    setSelectedVariation(0);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      // Add auth token if user is logged in
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const requestBody: any = {
        product,
        platform,
        tone,
        targetAudience,
        variationsCount
      };

      // Add brand profile if selected
      if (selectedBrand) {
        requestBody.brandProfileId = selectedBrand;
      }

      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const data: GenerateResponse = await response.json();

      if (response.ok) {
        // Handle new multi-variation format
        if (data.variations && Array.isArray(data.variations)) {
          setAdVariations(data.variations);
        } else {
          // Legacy single ad format - convert to array
          setAdVariations([data as AdContent]);
        }

        // Refresh user profile to get updated ads_remaining
        if (currentUser) {
          await refreshUserProfile();
        }
      } else {
        if (response.status === 403) {
          // Out of ads
          toast.error(data.message || 'No ads remaining. Please upgrade your plan or purchase more ads.');
          navigate('/pricing');
        } else if (response.status === 401) {
          // Not logged in and no free tier
          toast.info('Please sign in to generate ads');
          navigate('/login');
        } else {
          toast.error(data.error || 'Failed to generate ad');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate ad. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const copyAllVariations = () => {
    if (adVariations.length === 0) return;

    const formattedVariations = adVariations.map((variation, index) => {
      let text = `Variation ${index + 1}:\n\n`;

      // Format based on the type of ad
      if (variation.headline) {
        // Standard social media ad format
        text += `Headline: ${variation.headline}\n`;
        text += `Copy: ${variation.copy || ''}\n`;
        text += `CTA: ${variation.cta || ''}\n`;
        if (variation.hashtags && variation.hashtags.length > 0) {
          text += `Hashtags: ${variation.hashtags.join(' ')}\n`;
        }
      } else if (variation.hook) {
        // YouTube video script format
        text += `Hook: ${variation.hook}\n`;
        text += `Problem: ${variation.problem || ''}\n`;
        text += `Solution: ${variation.solution || ''}\n`;
        text += `CTA: ${variation.cta || ''}\n`;
      } else if (variation.title) {
        // Amazon product listing format
        text += `Title: ${variation.title}\n`;
        if (variation.bullets && variation.bullets.length > 0) {
          text += `\nBullet Points:\n`;
          variation.bullets.forEach((bullet, i) => {
            text += `${i + 1}. ${bullet}\n`;
          });
        }
        text += `\nDescription: ${variation.description || ''}\n`;
        if (variation.keywords && variation.keywords.length > 0) {
          text += `Keywords: ${variation.keywords.join(', ')}\n`;
        }
      }

      return text;
    }).join('\n---\n\n');

    navigator.clipboard.writeText(formattedVariations);
    toast.success(`All ${adVariations.length} variations copied to clipboard!`);
  };

  return (
    <div className="app">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title">
            Create High-Converting Ads in <span className="gradient-text">Seconds</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered ad copy for small businesses. No marketing degree required.
            Generate platform-specific ads that actually work.
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">9+</div>
              <div className="stat-label">Platforms</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">5</div>
              <div className="stat-label">Variations per Ad</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">30s</div>
              <div className="stat-label">Average Time</div>
            </div>
          </div>
          <div className="hero-cta">
            <button onClick={() => setActiveTab('generate')} className="cta-primary">
              Start Creating Free
            </button>
            <button onClick={() => navigate('/pricing')} className="cta-secondary">
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <h2 className="section-title">Why Small Businesses Love AdCreatorPro</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Generate 5 unique ad variations in under 30 seconds. No more staring at blank pages.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🎯</div>
            <h3>Platform-Optimized</h3>
            <p>Each ad is tailored for your chosen platform - Facebook, Instagram, YouTube, Amazon, and more.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">💰</div>
            <h3>Save Thousands</h3>
            <p>Skip the expensive copywriter. Get professional ad copy for a fraction of the cost.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🎨</div>
            <h3>Brand Voice Profiles</h3>
            <p>Save your brand details once, use them forever. Consistent messaging every time.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">📊</div>
            <h3>A/B Test Ready</h3>
            <p>Get multiple variations to test what works best for your audience.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🚀</div>
            <h3>No Experience Needed</h3>
            <p>Just describe your product and let AI do the heavy lifting. It's that simple.</p>
          </div>
        </div>
      </section>

      {/* Example Showcase */}
      <section className="example-section">
        <h2 className="section-title">See What You Can Create</h2>
        <p className="section-subtitle">Real examples generated by AdCreatorPro in seconds</p>
        <div className="examples-grid">
          <div className="example-card">
            <div className="example-platform">Facebook/Instagram</div>
            <div className="example-content">
              <strong>Headline:</strong> Transform Your Morning Routine
              <br/><br/>
              <strong>Copy:</strong> Wake up to the rich aroma of premium Colombian coffee. Hand-picked, ethically sourced, and roasted to perfection. Your perfect cup awaits.
              <br/><br/>
              <strong>CTA:</strong> Shop Now - Free Shipping on First Order
            </div>
          </div>
          <div className="example-card">
            <div className="example-platform">YouTube</div>
            <div className="example-content">
              <strong>Hook:</strong> Tired of weak, bitter coffee?
              <br/><br/>
              <strong>Problem:</strong> Most store-bought coffee loses flavor within weeks of roasting...
              <br/><br/>
              <strong>Solution:</strong> Our beans are roasted fresh every week and shipped directly to you...
            </div>
          </div>
          <div className="example-card">
            <div className="example-platform">Amazon</div>
            <div className="example-content">
              <strong>Title:</strong> Premium Colombian Coffee Beans - Medium Roast, 2lb Bag
              <br/><br/>
              <strong>Bullets:</strong>
              • 100% Arabica beans from Colombian highlands
              • Roasted fresh weekly for maximum flavor
              • Fair trade & ethically sourced
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2 className="section-title">Loved by Small Businesses</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="testimonial-text">
              "AdCreatorPro saved me hours every week. I used to struggle with writing ad copy,
              but now I can generate professional ads in seconds. My conversion rates have actually improved!"
            </p>
            <div className="testimonial-author">
              <strong>Sarah Martinez</strong>
              <span>Boutique Owner</span>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="testimonial-text">
              "As a solopreneur, I can't afford a copywriter. This tool is a game-changer.
              The multi-variation feature helps me A/B test different messages quickly."
            </p>
            <div className="testimonial-author">
              <strong>Mike Chen</strong>
              <span>Fitness Coach</span>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="testimonial-text">
              "I run ads on 5 different platforms. AdCreatorPro understands each platform's nuances
              and creates perfectly formatted copy every time. Worth every penny!"
            </p>
            <div className="testimonial-author">
              <strong>Jessica Kim</strong>
              <span>E-commerce Store Owner</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Create Better Ads?</h2>
        <p>Join thousands of small businesses creating high-converting ads with AI</p>
        <div className="cta-buttons">
          <button onClick={() => setActiveTab('generate')} className="cta-primary">
            Start Creating Free
          </button>
          <button onClick={() => navigate('/pricing')} className="cta-secondary">
            View Pricing
          </button>
        </div>
      </section>

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

              {currentUser && brandProfiles.length > 0 && (
                <div className="form-group">
                  <label>Brand Profile (Optional)</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="input select"
                  >
                    <option value="">None - Generate without brand context</option>
                    {brandProfiles.map(profile => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} {profile.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedBrand && (
                    <small style={{ color: '#667eea', marginTop: '0.5rem', display: 'block' }}>
                      ✨ Using {brandProfiles.find(p => p.id === selectedBrand)?.name} brand voice
                    </small>
                  )}
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

              <div className="form-group">
                <label>Number of Variations: {variationsCount}</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={variationsCount}
                  onChange={(e) => setVariationsCount(parseInt(e.target.value))}
                  className="slider"
                  style={{ width: '100%' }}
                />
                <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                  Generate {variationsCount} different {variationsCount === 1 ? 'version' : 'versions'} with unique angles and hooks
                </small>
              </div>

              <button
                onClick={generateAd}
                disabled={loading}
                className="generate-btn"
              >
                {loading ? `✨ Generating ${variationsCount} ${variationsCount === 1 ? 'Variation' : 'Variations'}...` : `🚀 Generate ${variationsCount} Ad ${variationsCount === 1 ? 'Variation' : 'Variations'}`}
              </button>
            </div>

            {adVariations.length > 0 && (
              <div className="result-container">
                <h2>Your Generated {platform?.includes('YouTube') ? 'Video Scripts' : platform?.includes('Amazon') ? 'Product Listings' : 'Ads'} 🎉</h2>

                {adVariations.length > 1 && (
                  <div className="variations-tabs">
                    {adVariations.map((_, index) => (
                      <button
                        key={index}
                        className={`variation-tab ${selectedVariation === index ? 'active' : ''}`}
                        onClick={() => setSelectedVariation(index)}
                      >
                        Variation {index + 1}
                      </button>
                    ))}
                  </div>
                )}

                {adVariations.length > 1 && (
                  <button
                    onClick={copyAllVariations}
                    className="copy-all-btn"
                    style={{
                      marginTop: '1rem',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.2s',
                      width: '100%',
                      maxWidth: '300px',
                      margin: '1rem auto',
                      display: 'block'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                    }}
                  >
                    📋 Copy All {adVariations.length} Variations
                  </button>
                )}

                <div className="ad-preview">
                  {/* YouTube Video Script Format */}
                  {adVariations[selectedVariation]?.hook && (
                    <>
                      <div className="ad-section">
                        <div className="ad-label">🎬 Hook (0-3s)</div>
                        <div className="ad-content">{adVariations[selectedVariation].hook}</div>
                        <button onClick={() => copyToClipboard(adVariations[selectedVariation].hook!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <div className="ad-section">
                        <div className="ad-label">⚠️ Problem (3-8s)</div>
                        <div className="ad-content">{adVariations[selectedVariation].problem}</div>
                        <button onClick={() => copyToClipboard(adVariations[selectedVariation].problem!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <div className="ad-section">
                        <div className="ad-label">✅ Solution (8-20s)</div>
                        <div className="ad-content">{adVariations[selectedVariation].solution}</div>
                        <button onClick={() => copyToClipboard(adVariations[selectedVariation].solution!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <div className="ad-section">
                        <div className="ad-label">🎯 Call-to-Action (20-30s)</div>
                        <div className="ad-content cta">{adVariations[selectedVariation].cta}</div>
                        <button onClick={() => copyToClipboard(adVariations[selectedVariation].cta!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <button
                        onClick={() => {
                          const fullScript = `HOOK (0-3s):\n${adVariations[selectedVariation].hook}\n\nPROBLEM (3-8s):\n${adVariations[selectedVariation].problem}\n\nSOLUTION (8-20s):\n${adVariations[selectedVariation].solution}\n\nCTA (20-30s):\n${adVariations[selectedVariation].cta}`;
                          copyToClipboard(fullScript);
                        }}
                        className="copy-all-btn"
                      >
                        📋 Copy Full Script
                      </button>
                    </>
                  )}

                  {/* Amazon Product Listing Format */}
                  {adVariations[selectedVariation].title && (
                    <>
                      <div className="ad-section">
                        <div className="ad-label">📦 Product Title</div>
                        <div className="ad-content">{adVariations[selectedVariation].title}</div>
                        <button onClick={() => copyToClipboard(adVariations[selectedVariation].title!)} className="copy-btn">📋 Copy</button>
                      </div>

                      {adVariations[selectedVariation].bullets && adVariations[selectedVariation].bullets.length > 0 && (
                        <div className="ad-section">
                          <div className="ad-label">⭐ Key Features (Bullets)</div>
                          <div className="ad-content">
                            <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                              {adVariations[selectedVariation].bullets.map((bullet, idx) => (
                                <li key={idx}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                          <button onClick={() => copyToClipboard(adVariations[selectedVariation].bullets!.join('\n• '))} className="copy-btn">📋 Copy</button>
                        </div>
                      )}

                      <div className="ad-section">
                        <div className="ad-label">📝 Product Description</div>
                        <div className="ad-content">{adVariations[selectedVariation].description}</div>
                        <button onClick={() => copyToClipboard(adVariations[selectedVariation].description!)} className="copy-btn">📋 Copy</button>
                      </div>

                      {adVariations[selectedVariation].keywords && adVariations[selectedVariation].keywords.length > 0 && (
                        <div className="ad-section">
                          <div className="ad-label">🔍 SEO Keywords</div>
                          <div className="ad-content hashtags">{adVariations[selectedVariation].keywords.join(', ')}</div>
                          <button onClick={() => copyToClipboard(adVariations[selectedVariation].keywords!.join(', '))} className="copy-btn">📋 Copy</button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const fullListing = `TITLE:\n${adVariations[selectedVariation].title}\n\nBULLET POINTS:\n• ${adVariations[selectedVariation].bullets?.join('\n• ')}\n\nDESCRIPTION:\n${adVariations[selectedVariation].description}\n\nKEYWORDS:\n${adVariations[selectedVariation].keywords?.join(', ')}`;
                          copyToClipboard(fullListing);
                        }}
                        className="copy-all-btn"
                      >
                        📋 Copy Full Listing
                      </button>
                    </>
                  )}

                  {/* Standard Social Media Ad Format */}
                  {adVariations[selectedVariation].headline && !adVariations[selectedVariation].hook && !adVariations[selectedVariation].title && (
                    <>
                      <div className="ad-section">
                        <div className="ad-label">📌 Headline</div>
                        <div className="ad-content">{adVariations[selectedVariation].headline}</div>
                        <button onClick={() => copyToClipboard(adVariations[selectedVariation].headline!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <div className="ad-section">
                        <div className="ad-label">📝 Ad Copy</div>
                        <div className="ad-content">{adVariations[selectedVariation].copy}</div>
                        <button onClick={() => copyToClipboard(adVariations[selectedVariation].copy!)} className="copy-btn">📋 Copy</button>
                      </div>

                      <div className="ad-section">
                        <div className="ad-label">🎯 Call-to-Action</div>
                        <div className="ad-content cta">{adVariations[selectedVariation].cta}</div>
                        <button onClick={() => copyToClipboard(adVariations[selectedVariation].cta!)} className="copy-btn">📋 Copy</button>
                      </div>

                      {adVariations[selectedVariation].hashtags && adVariations[selectedVariation].hashtags.length > 0 && (
                        <div className="ad-section">
                          <div className="ad-label">#️⃣ Hashtags</div>
                          <div className="ad-content hashtags">
                            {Array.isArray(adVariations[selectedVariation].hashtags) ? adVariations[selectedVariation].hashtags.join(' ') : adVariations[selectedVariation].hashtags}
                          </div>
                          <button onClick={() => copyToClipboard(Array.isArray(adVariations[selectedVariation].hashtags) ? adVariations[selectedVariation].hashtags.join(' ') : String(adVariations[selectedVariation].hashtags))} className="copy-btn">
                            📋 Copy
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const fullAd = `${adVariations[selectedVariation].headline}\n\n${adVariations[selectedVariation].copy}\n\n${adVariations[selectedVariation].cta}\n\n${Array.isArray(adVariations[selectedVariation].hashtags) ? adVariations[selectedVariation].hashtags.join(' ') : adVariations[selectedVariation].hashtags}`;
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
