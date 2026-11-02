import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { postsAPI, uploadAPI } from '../api/index.js';
import { useData } from '../context/DataContext.jsx';

export default function Schedule() {
  const [searchParams] = useSearchParams();
  const { accounts, posts, refreshPosts } = useData();
  const [media, setMedia] = useState([]); // Store uploaded media
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatingCaptionFor, setGeneratingCaptionFor] = useState(null); // 'global' or accountId
  const [tone, setTone] = useState('attractive');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [customizeCaptions, setCustomizeCaptions] = useState(false);
  const [individualCaptions, setIndividualCaptions] = useState({});
  const [individualTones, setIndividualTones] = useState({});
  const [individualPrompts, setIndividualPrompts] = useState({});
  const [showPromptFor, setShowPromptFor] = useState({});
  const [form, setForm] = useState({
    content: '',
    scheduledAt: '',
    media: [],
  });
  const [scheduling, setScheduling] = useState(false);
  const [activeCaptionTab, setActiveCaptionTab] = useState(null);
  const notifiedFailedRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);



  const handleGenerateCaption = async (targetAccountId = null) => {
    const imageFile = media.find(file => file.mimetype.startsWith('image/'));
    if (!imageFile) {
      toast.error('Please upload at least one image to generate a caption.');
      return;
    }

    const currentTone = targetAccountId ? (individualTones[targetAccountId] || 'attractive') : tone;
    const currentPrompt = targetAccountId ? (individualPrompts[targetAccountId] || '') : customPrompt;

    setGeneratingCaption(true);
    setGeneratingCaptionFor(targetAccountId || 'global');

    try {
      const res = await uploadAPI.generateCaption({
        imageUrl: imageFile.url,
        tone: currentTone,
        prompt: currentPrompt,
      });

      if (targetAccountId) {
        setIndividualCaptions(prev => ({
          ...prev,
          [targetAccountId]: res.data.caption
        }));
      } else {
        const oldContent = form.content;
        setForm(prev => ({
          ...prev,
          content: res.data.caption
        }));
        // Update all individual captions that are in sync with global content
        setIndividualCaptions(prev => {
          const updated = { ...prev };
          selectedAccountIds.forEach(id => {
            if (updated[id] === undefined || updated[id] === oldContent || updated[id] === '') {
              updated[id] = res.data.caption;
            }
          });
          return updated;
        });
      }

      toast.success('AI Caption generated successfully!');
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      toast.error(errorMsg || 'Failed to generate AI caption. Make sure NVIDIA_API_KEY is configured in the server environment.');
    } finally {
      setGeneratingCaption(false);
      setGeneratingCaptionFor(null);
    }
  };

  useEffect(() => {
    if (searchParams.get('connected') === 'facebook') {
      toast.success('Facebook/Instagram connected!');
    }
    if (searchParams.get('error')) {
      toast.error('Failed to connect account');
    }
  }, []);

  useEffect(() => {
    if (customizeCaptions && selectedAccountIds.length > 1) {
      if (!activeCaptionTab || !selectedAccountIds.includes(activeCaptionTab)) {
        setActiveCaptionTab(selectedAccountIds[0]);
      }
    } else {
      setActiveCaptionTab(null);
    }
  }, [customizeCaptions, selectedAccountIds, activeCaptionTab]);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }
  }, []);

  // Poll scheduled posts in background every 10 seconds to discover any publishing failure
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPosts();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshPosts]);

  // Check for background post failures and notify the user
  useEffect(() => {
    if (posts && posts.length > 0) {
      if (isFirstLoadRef.current) {
        posts.forEach(p => {
          if (p.status === 'failed') {
            notifiedFailedRef.current.add(p._id);
          }
        });
        isFirstLoadRef.current = false;
      } else {
        posts.forEach(p => {
          if (p.status === 'failed' && !notifiedFailedRef.current.has(p._id)) {
            notifiedFailedRef.current.add(p._id);
            const accountName = p.account?.name || 'Unknown';
            const platform = p.platform || p.account?.platform || 'Social Media';
            const errorMsg = p.error || 'Unknown publishing error';
            const msg = `Publishing failed for ${accountName} (${platform}): ${errorMsg}`;
            
            toast.error(msg, { duration: 8000 });
            
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('Post Publishing Failed', {
                  body: msg
                });
              } catch (e) {
                console.error('Desktop notification failed:', e);
              }
            }
          }
        });
      }
    }
  }, [posts]);



  const handleMediaChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(`Uploading 1 of ${files.length}...`);

    try {
      // Process files sequentially (one-by-one) to guarantee that the user's
      // selection order is preserved exactly in the uploaded media list.
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
        const formData = new FormData();
        formData.append('media', files[i]);

        const res = await uploadAPI.upload(formData);
        setMedia(prev => [...prev, res.data.file]);
      }
      toast.success('All media uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setUploading(false);
      setUploadProgress('');
      e.target.value = ''; // Reset file input so the same files can be re-selected if needed
    }
  };

  const handleRemoveMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveMedia = (index, direction) => {
    setMedia(prev => {
      const updated = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < updated.length) {
        // Swap elements
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedAccountIds.length === 0) {
      toast.error('Please select at least one account to post to.');
      return;
    }
    if (scheduling) return;

    setScheduling(true);
    try {
      const transformedMedia = media.map(m => ({
        url: m.url,
        type: m.mimetype.startsWith('video/') ? 'video' : 'image'
      }));
      
      const utcScheduledAt = new Date(form.scheduledAt).toISOString();
      
      // Schedule post for each selected account
      await Promise.all(
        selectedAccountIds.map(accId => {
          const finalContent = customizeCaptions 
            ? (individualCaptions[accId] !== undefined ? individualCaptions[accId] : form.content)
            : form.content;

          return postsAPI.create({
            accountId: accId,
            content: finalContent,
            scheduledAt: utcScheduledAt,
            media: transformedMedia
          });
        })
      );
      
      toast.success(`Post scheduled successfully for ${selectedAccountIds.length} account(s)!`);
      setForm({ content: '', scheduledAt: '', media: [] });
      setSelectedAccountIds([]);
      setMedia([]);
      setCustomizeCaptions(false);
      setIndividualCaptions({});
      setIndividualTones({});
      setIndividualPrompts({});
      setCustomPrompt('');
      setShowPromptFor({});
      setActiveCaptionTab(null);
      refreshPosts();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to schedule post';
      toast.error(errorMsg);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Scheduling Failed', {
            body: `Error: ${errorMsg}`
          });
        } catch (e) {
          console.error('Desktop notification failed:', e);
        }
      }
    } finally {
      setScheduling(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await postsAPI.remove(id);
      toast.success('Post deleted successfully');
      refreshPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const handleRetry = (post) => {
    // Scroll to the form card smoothly
    const formCard = document.querySelector('.form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth' });
    }

    // 1. Select the account
    if (post.account && post.account._id) {
      setSelectedAccountIds([post.account._id]);
      
      // Update individual captions and tones for this account
      setIndividualCaptions({
        [post.account._id]: post.content
      });
      setIndividualTones({
        [post.account._id]: tone
      });
    } else {
      setSelectedAccountIds([]);
      setIndividualCaptions({});
      setIndividualTones({});
    }

    // Helper: Convert Date from Backend to Local ISO string (for datetime-local input)
    const formatLocalDate = (dateString) => {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
      return localISOTime;
    };

    // 2. Set form states
    setForm({
      content: post.content,
      scheduledAt: formatLocalDate(post.scheduledAt),
      media: [],
    });

    // 3. Set the media uploads list
    if (post.media && post.media.length > 0) {
      const mappedMedia = post.media.map(m => ({
        url: m.url,
        mimetype: m.type === 'video' ? 'video/mp4' : 'image/jpeg',
        filename: m.url.split('/').pop() || 'media_file',
        originalname: m.url.split('/').pop() || 'media_file',
      }));
      setMedia(mappedMedia);
    } else {
      setMedia([]);
    }

    toast.success('Post details loaded into form!');
  };

  return (
    <div className="schedule-page">
      <div className="card form-card">
        <h3>Schedule New Post</h3>
        <form onSubmit={handleSubmit}>
          <div className="account-selector-wrapper" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Select Accounts to Post To
            </label>
            {accounts.length === 0 ? (
              <p className="empty" style={{ padding: '12px' }}>No accounts connected yet. Connect accounts in the Dashboard.</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      const allIds = accounts.map(a => a._id);
                      setSelectedAccountIds(allIds);
                      // Pre-fill captions and tones for new selections
                      setIndividualCaptions(prev => {
                        const updated = { ...prev };
                        allIds.forEach(id => {
                          if (updated[id] === undefined) updated[id] = form.content;
                        });
                        return updated;
                      });
                      setIndividualTones(prev => {
                        const updated = { ...prev };
                        allIds.forEach(id => {
                          if (updated[id] === undefined) updated[id] = tone;
                        });
                        return updated;
                      });
                    }}
                    className="btn-clear-selection"
                  >
                    Select All
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedAccountIds([]);
                    }}
                    className="btn-clear-selection"
                  >
                    Clear All
                  </button>
                </div>
                <div className="platform-select-grid">
                  {accounts.map((acc) => {
                    const isSelected = selectedAccountIds.includes(acc._id);
                    return (
                      <div 
                        key={acc._id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAccountIds(selectedAccountIds.filter(id => id !== acc._id));
                          } else {
                            setSelectedAccountIds([...selectedAccountIds, acc._id]);
                            // Pre-fill caption & tone for this account if they don't exist yet
                            if (individualCaptions[acc._id] === undefined) {
                              setIndividualCaptions(prev => ({
                                ...prev,
                                [acc._id]: form.content
                              }));
                            }
                            if (individualTones[acc._id] === undefined) {
                              setIndividualTones(prev => ({
                                ...prev,
                                [acc._id]: tone
                              }));
                            }
                          }
                        }}
                        className={`platform-select-card ${isSelected ? 'selected' : ''}`}
                      >
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="platform-select-checkbox"
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                          <span className={`platform-badge ${acc.platform}`} style={{ alignSelf: 'flex-start', fontSize: '9px', padding: '2px 6px' }}>{acc.platform}</span>
                          <span style={{ fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="media-upload">
            <h4>Media Upload (Carousel Support)</h4>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              disabled={uploading}
              multiple
            />
            {uploading && (
              <div className="upload-progress-container">
                <span className="upload-spinner"></span>
                <p className="upload-progress-text">{uploadProgress || 'Uploading...'}</p>
              </div>
            )}

            {media.length > 0 && (
              <div className="media-preview-carousel-container">
                <h5>Carousel Preview (Reorder sequence using arrows):</h5>
                <div className="media-preview-carousel">
                  {media.map((file, index) => (
                    <div key={index} className="media-carousel-item">
                      <span className="media-badge">{index + 1}</span>
                      {file.mimetype.startsWith('image/') ? (
                        <img src={file.url} alt={file.originalname} />
                      ) : (
                        <video src={file.url} controls={false} muted></video>
                      )}
                      <div className="media-carousel-actions">
                        <button
                          type="button"
                          className="btn-carousel-action"
                          disabled={index === 0}
                          onClick={() => handleMoveMedia(index, 'left')}
                          title="Move Left"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="carousel-btn-icon">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-carousel-action remove"
                          onClick={() => handleRemoveMedia(index)}
                          title="Remove"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="carousel-btn-icon remove-icon">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.587 7.402a.75.75 0 01.748.705l.3 6a.75.75 0 01-1.496.075l-.3-6a.75.75 0 01.748-.78zM12.16 7.478a.75.75 0 01.705.747l-.3 6a.75.75 0 01-1.496-.074l.3-6a.75.75 0 01.79-.673z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-carousel-action"
                          disabled={index === media.length - 1}
                          onClick={() => handleMoveMedia(index, 'right')}
                          title="Move Right"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="carousel-btn-icon">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedAccountIds.length > 1 && (
            <div className="customize-captions-toggle" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <input
                type="checkbox"
                id="customizeCaptions"
                checked={customizeCaptions}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setCustomizeCaptions(checked);
                  if (checked) {
                    // Populate individual captions and tones with default values if they aren't set
                    setIndividualCaptions(prev => {
                      const updated = { ...prev };
                      selectedAccountIds.forEach(id => {
                        if (updated[id] === undefined || updated[id] === '') {
                          updated[id] = form.content;
                        }
                      });
                      return updated;
                    });
                    setIndividualTones(prev => {
                      const updated = { ...prev };
                      selectedAccountIds.forEach(id => {
                        if (updated[id] === undefined) {
                          updated[id] = tone;
                        }
                      });
                      return updated;
                    });
                  }
                }}
                style={{ width: 'auto', cursor: 'pointer', margin: 0 }}
              />
              <label htmlFor="customizeCaptions" style={{ cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: 'var(--text)' }}>
                Customize captions for each selected account
              </label>
            </div>
          )}

          {customizeCaptions && selectedAccountIds.length > 1 ? (
            <div className="individual-captions-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <label style={{ fontWeight: '700', fontSize: '14px', color: 'var(--primary)' }}>Custom Captions per Account</label>
              
              <div className="custom-captions-tabs">
                {selectedAccountIds.map(accId => {
                  const acc = accounts.find(a => a._id === accId);
                  if (!acc) return null;
                  const isActive = activeCaptionTab === accId;
                  const isCaptionWritten = individualCaptions[accId] && individualCaptions[accId].trim() !== '';
                  return (
                    <button
                      key={accId}
                      type="button"
                      className={`custom-caption-tab-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveCaptionTab(accId)}
                    >
                      <span className={`platform-badge ${acc.platform}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{acc.platform}</span>
                      <span>{acc.name}</span>
                      {isCaptionWritten && (
                        <span style={{ color: 'var(--success)', marginLeft: '4px', fontSize: '10px' }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {(() => {
                const accId = activeCaptionTab;
                if (!accId) return null;
                const acc = accounts.find(a => a._id === accId);
                if (!acc) return null;
                const isGeneratingThis = generatingCaption && generatingCaptionFor === accId;

                return (
                  <div key={accId} className="custom-caption-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{
                      background: 'rgba(30, 33, 54, 0.3)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`platform-badge ${acc.platform}`} style={{ fontSize: '10px', padding: '3px 8px' }}>{acc.platform}</span>
                          <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>{acc.name}</span>
                        </div>
                        
                        {media.some(file => file.mimetype.startsWith('image/')) && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                              value={individualTones[accId] || 'attractive'}
                              onChange={(e) => setIndividualTones({
                                ...individualTones,
                                [accId]: e.target.value
                              })}
                              className="select-ai-tone"
                              disabled={generatingCaption}
                              style={{ padding: '6px 28px 6px 10px', fontSize: '12px', height: '32px', width: 'auto', backgroundPosition: 'right 10px center' }}
                            >
                              <option value="attractive">Attractive ✨</option>
                              <option value="professional">Professional 📈</option>
                              <option value="funny">Funny 😂</option>
                              <option value="personal">Personal 💬</option>
                              <option value="joy">Joy ☀️</option>
                              <option value="advertisement">Advertisement 📢</option>
                              <option value="marketing">Marketing 🎯</option>
                              <option value="custom">Custom Prompt ✍️</option>
                            </select>
                            <button
                              type="button"
                              className="btn-ai-generate"
                              onClick={() => handleGenerateCaption(accId)}
                              disabled={generatingCaption}
                              style={{ padding: '6px 14px', fontSize: '12px', height: '32px' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ai-icon" style={{ width: '12px', height: '12px', marginRight: '4px' }}>
                                <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.845.813a.75.75 0 0 1 0 1.442l-2.845.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.845-.813a.75.75 0 0 1 0-1.442l2.845-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258.903a1.5 1.5 0 0 0 1.05 1.05l.903.258a.75.75 0 0 1 0 1.448l-.903.258a1.5 1.5 0 0 0-1.05 1.05l-.258.903a.75.75 0 0 1-1.448 0l-.258-.903a1.5 1.5 0 0 0-1.05-1.05l-.903-.258a.75.75 0 0 1 0-1.448l.903-.258a1.5 1.5 0 0 0 1.05-1.05l.258-.903A.75.75 0 0 1 18 1.5ZM11.25 21a.75.75 0 0 1 .728.568l.258.903a1.5 1.5 0 0 0 1.05 1.05l.903.258a.75.75 0 0 1 0 1.448l-.903.258a1.5 1.5 0 0 0-1.05 1.05l-.258.903a.75.75 0 0 1-1.448 0l-.258-.903a1.5 1.5 0 0 0-1.05-1.05l-.903-.258a.75.75 0 0 1 0-1.448l.903-.258a1.5 1.5 0 0 0 1.05-1.05l.258-.903A.75.75 0 0 1 11.25 21Z" clipRule="evenodd" />
                              </svg>
                              {isGeneratingThis ? 'Writing...' : 'AI Write'}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {individualTones[accId] === 'custom' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style={{ width: '12px', height: '12px' }}>
                              <path d="M7.25 3.688a8.035 8.035 0 0 0-4.872-.523A.5.5 0 0 0 2 3.64v7.994c0 .345.342.588.679.512a7.029 7.029 0 0 1 4.571.545V3.688ZM8.75 12.691a7.03 7.03 0 0 1 4.572-.545c.336.076.678-.167.678-.512V3.64a.5.5 0 0 0-.378-.475 8.034 8.034 0 0 0-4.872.523v8.903Z" />
                            </svg>
                            Custom AI Prompt Instructions for {acc.platform}
                          </label>
                          <textarea
                            placeholder={`e.g. "Write in Hinglish for Indian audience", "Mention our sale ends Sunday", "Focus on the product quality"...`}
                            value={individualPrompts[accId] || ''}
                            onChange={(e) => setIndividualPrompts(prev => ({ ...prev, [accId]: e.target.value }))}
                            rows={3}
                            style={{
                              minHeight: '80px',
                              fontSize: '13px',
                              background: 'rgba(139, 92, 246, 0.06)',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              borderRadius: '8px',
                              color: 'var(--text)',
                              padding: '10px 12px',
                              resize: 'vertical',
                              lineHeight: '1.5'
                            }}
                          />
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                            💡 These instructions guide the AI when generating the caption above. Click <strong>AI Write</strong> to apply.
                          </p>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Caption Content</label>
                        <textarea
                          placeholder={`Caption for ${acc.name}...`}
                          value={individualCaptions[accId] || ''}
                          onChange={(e) => setIndividualCaptions({
                            ...individualCaptions,
                            [accId]: e.target.value
                          })}
                          rows={8}
                          required
                          style={{ minHeight: '200px', fontSize: '14px', lineHeight: '1.6', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>Characters: {(individualCaptions[accId] || '').length}</span>
                          <span>Line breaks supported</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <>
              <div className="textarea-header">
                <label>Post Content</label>
                {media.some(file => file.mimetype.startsWith('image/')) && (
                  <div className="ai-controls-wrapper">
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="select-ai-tone"
                      disabled={generatingCaption}
                      title="Choose AI Tone"
                    >
                      <option value="attractive">Attractive ✨</option>
                      <option value="professional">Professional 📈</option>
                      <option value="funny">Funny 😂</option>
                      <option value="personal">Personal 💬</option>
                      <option value="joy">Joy ☀️</option>
                      <option value="advertisement">Advertisement 📢</option>
                      <option value="marketing">Marketing 🎯</option>
                      <option value="custom">Custom Prompt ✍️</option>
                    </select>
                    <button
                      type="button"
                      className="btn-ai-generate"
                      onClick={() => handleGenerateCaption()}
                      disabled={generatingCaption}
                      title="Generate AI Caption"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
                        <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.845.813a.75.75 0 0 1 0 1.442l-2.845.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.845-.813a.75.75 0 0 1 0-1.442l2.845-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258.903a1.5 1.5 0 0 0 1.05 1.05l.903.258a.75.75 0 0 1 0 1.448l-.903.258a1.5 1.5 0 0 0-1.05 1.05l-.258.903a.75.75 0 0 1-1.448 0l-.258-.903a1.5 1.5 0 0 0-1.05-1.05l-.903-.258a.75.75 0 0 1 0-1.448l.903-.258a1.5 1.5 0 0 0 1.05-1.05l.258-.903A.75.75 0 0 1 18 1.5ZM11.25 21a.75.75 0 0 1 .728.568l.258.903a1.5 1.5 0 0 0 1.05 1.05l.903.258a.75.75 0 0 1 0 1.448l-.903.258a1.5 1.5 0 0 0-1.05 1.05l-.258.903a.75.75 0 0 1-1.448 0l-.258-.903a1.5 1.5 0 0 0-1.05-1.05l-.903-.258a.75.75 0 0 1 0-1.448l.903-.258a1.5 1.5 0 0 0 1.05-1.05l.258-.903A.75.75 0 0 1 11.25 21Z" clipRule="evenodd" />
                      </svg>
                      {generatingCaption && generatingCaptionFor === 'global' ? 'Generating...' : 'AI Write'}
                    </button>
                  </div>
                )}
              </div>

              {tone === 'custom' && media.some(file => file.mimetype.startsWith('image/')) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>
                    Custom AI Prompt Instructions
                  </label>
                  <textarea
                    placeholder={`e.g. "Write a professional post highlighting a new feature", "Focus on the visual colors and write in Hinglish", "Make it humorous"...`}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    style={{
                      minHeight: '80px',
                      fontSize: '13px',
                      background: 'rgba(139, 92, 246, 0.06)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      padding: '10px 12px',
                      resize: 'vertical',
                      lineHeight: '1.5'
                    }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    💡 Click <strong>AI Write</strong> to generate the caption based on these instructions.
                  </p>
                </div>
              )}

              <textarea
                placeholder="Post content"
                value={form.content}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, content: val });
                  // Also update any individual captions that have not been customized yet
                  setIndividualCaptions(prev => {
                    const updated = { ...prev };
                    selectedAccountIds.forEach(id => {
                      // If the caption for this account is identical to the old global caption or hasn't been set,
                      // we keep it in sync with the global input.
                      if (updated[id] === undefined || updated[id] === form.content) {
                        updated[id] = val;
                      }
                    });
                    return updated;
                  });
                }}
                rows={4}
                required
              />
            </>
          )}
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            required
          />
          <button type="submit" className="btn-primary" disabled={uploading || scheduling}>
            {uploading ? 'Uploading...' : scheduling ? 'Scheduling...' : 'Schedule'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Scheduled Posts</h3>
        {posts.length === 0 ? (
          <p className="empty">No posts yet</p>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post._id} className={`post-item ${post.status}`}>
                <div className="post-meta">
                  <span className={`platform-badge ${post.platform}`}>{post.platform}</span>
                  <span className={`status-badge ${post.status}`}>{post.status}</span>
                  <span className="post-date">{new Date(post.scheduledAt).toLocaleString()}</span>
                </div>
                <p className="post-content">{post.content}</p>
                {post.media && post.media.length > 0 && (
                  <div className="post-media">
                    {post.media.map((media, index) => (
                      <div key={index} className={`media-preview ${media.type}`}>
                        {media.type === 'image' ? (
                          <img src={media.url} alt="Post media" style={{maxWidth: '100px'}} />
                        ) : (
                          <video controls style={{maxWidth: '100px'}} src={media.url}></video>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {post.status === 'failed' && (
                  <p className="post-error">{post.error}</p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                  <button 
                    type="button"
                    className="btn-edit btn-sm" 
                    onClick={() => handleRetry(post)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '13px', height: '13px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Retry
                  </button>
                  <button 
                    type="button"
                    className="btn-danger btn-sm" 
                    onClick={() => handleDelete(post._id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '13px', height: '13px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
