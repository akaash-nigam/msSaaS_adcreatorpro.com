import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './BrandProfiles.css';

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
  created_at: string;
}

export default function BrandProfiles() {
  const { getIdToken } = useAuth();
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BrandProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    target_audience: '',
    brand_voice: '',
    keywords: '',
    example_content: '',
    website_url: '',
    is_default: false
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      const token = await getIdToken();
      const response = await fetch('/api/brand-profiles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingProfile(null);
    setFormData({
      name: '',
      industry: '',
      description: '',
      target_audience: '',
      brand_voice: '',
      keywords: '',
      example_content: '',
      website_url: '',
      is_default: false
    });
    setShowModal(true);
  }

  function openEditModal(profile: BrandProfile) {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      industry: profile.industry || '',
      description: profile.description || '',
      target_audience: profile.target_audience || '',
      brand_voice: profile.brand_voice || '',
      keywords: profile.keywords?.join(', ') || '',
      example_content: profile.example_content || '',
      website_url: profile.website_url || '',
      is_default: profile.is_default
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const token = await getIdToken();
      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k);

      const body = {
        ...formData,
        keywords,
        isDefault: formData.is_default
      };

      const url = editingProfile
        ? `/api/brand-profiles/${editingProfile.id}`
        : '/api/brand-profiles';

      const method = editingProfile ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowModal(false);
        fetchProfiles();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save brand profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save brand profile');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this brand profile?')) {
      return;
    }

    try {
      const token = await getIdToken();
      const response = await fetch(`/api/brand-profiles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProfiles();
      } else {
        alert('Failed to delete brand profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete brand profile');
    }
  }

  if (loading) {
    return <div className="loading-screen">Loading brand profiles...</div>;
  }

  return (
    <div className="brand-profiles-page">
      <div className="brand-profiles-header">
        <div>
          <h1>Brand Profiles</h1>
          <p>Manage your brand voices for consistent ad generation</p>
        </div>
        <button className="create-profile-btn" onClick={openCreateModal}>
          + Create Brand Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="empty-state">
          <h2>No brand profiles yet</h2>
          <p>Create your first brand profile to generate consistent, on-brand ads</p>
          <button className="create-profile-btn" onClick={openCreateModal}>
            + Create Your First Profile
          </button>
        </div>
      ) : (
        <div className="profiles-grid">
          {profiles.map(profile => (
            <div key={profile.id} className={`profile-card ${profile.is_default ? 'default' : ''}`}>
              {profile.is_default && <div className="default-badge">Default</div>}

              <div className="profile-card-header">
                <h3>{profile.name}</h3>
                {profile.industry && <span className="industry-tag">{profile.industry}</span>}
              </div>

              {profile.description && (
                <p className="profile-description">{profile.description}</p>
              )}

              <div className="profile-details">
                {profile.target_audience && (
                  <div className="detail-item">
                    <strong>Target Audience:</strong> {profile.target_audience}
                  </div>
                )}
                {profile.brand_voice && (
                  <div className="detail-item">
                    <strong>Brand Voice:</strong> {profile.brand_voice}
                  </div>
                )}
                {profile.keywords && profile.keywords.length > 0 && (
                  <div className="detail-item">
                    <strong>Keywords:</strong>
                    <div className="keywords-tags">
                      {profile.keywords.slice(0, 5).map((keyword, i) => (
                        <span key={i} className="keyword-tag">{keyword}</span>
                      ))}
                      {profile.keywords.length > 5 && (
                        <span className="keyword-tag">+{profile.keywords.length - 5}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-actions">
                <button className="edit-btn" onClick={() => openEditModal(profile)}>
                  Edit
                </button>
                <button className="delete-btn" onClick={() => handleDelete(profile.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProfile ? 'Edit Brand Profile' : 'Create Brand Profile'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label>Brand Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., TechStartup Inc."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Industry</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    placeholder="e.g., Technology, Fashion"
                  />
                </div>

                <div className="form-group">
                  <label>Brand Voice/Tone</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.brand_voice}
                    onChange={(e) => setFormData({...formData, brand_voice: e.target.value})}
                    placeholder="e.g., Professional, Friendly"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Brand Description</label>
                <textarea
                  className="input textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What does your brand do? What makes it unique?"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Target Audience</label>
                <input
                  type="text"
                  className="input"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                  placeholder="e.g., Small business owners, Tech enthusiasts"
                />
              </div>

              <div className="form-group">
                <label>Keywords (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  placeholder="e.g., innovation, quality, affordable"
                />
              </div>

              <div className="form-group">
                <label>Example Content (Optional)</label>
                <textarea
                  className="input textarea"
                  value={formData.example_content}
                  onChange={(e) => setFormData({...formData, example_content: e.target.value})}
                  placeholder="Paste an example of your brand's writing style..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="url"
                  className="input"
                  value={formData.website_url}
                  onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                  />
                  <span>Set as default brand profile</span>
                </label>
                <small>Default profile will be pre-selected when generating ads</small>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingProfile ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
