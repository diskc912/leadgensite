import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [niche, setNiche] = useState('gyms');
  const [city, setCity] = useState('delhi');
  const [limit, setLimit] = useState(20); // default fetch size
  
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Download CSV Core Logic
  const downloadCSV = () => {
    if (leads.length === 0) return;
    
    // Define headers
    const headers = ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews'];
    
    // Map rows logically
    const csvRows = leads.map(lead => [
      `"${lead.name || ''}"`,
      `"${lead.address || ''}"`,
      `"${lead.phone || ''}"`,
      `"${lead.website || 'No Website'}"`,
      lead.rating || 'N/A',
      lead.reviewCount || '0'
    ].join(','));

    // Join array into CSV format
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Create native blob download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${niche}_${city}_leads.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Google Sheets Direct Copy Logic
  const openInGoogleSheets = async () => {
    if (leads.length === 0) return;
    
    const headers = ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews'];
    
    // Google Sheets uses Tab-Separated Values (TSV) for clean pasting
    const tsvRows = leads.map(lead => [
      lead.name || 'Unknown',
      lead.address || 'N/A',
      lead.phone || 'N/A',
      lead.website || 'No Website',
      lead.rating || 'N/A',
      lead.reviewCount || '0'
    ].join('\t'));

    const tsvContent = [headers.join('\t'), ...tsvRows].join('\n');
    
    try {
      await navigator.clipboard.writeText(tsvContent);
      alert('Data copied! Opening a blank Google Sheet for you now. Just press Ctrl+V (or Cmd+V) to instantly paste all your leads into perfectly formatted columns!');
      // Open a brand new Google Sheet in a new tab
      window.open('https://sheets.new/', '_blank');
    } catch (err) {
      alert('Failed to copy to clipboard.');
    }
  };

  const handleExportSelect = (e) => {
    const action = e.target.value;
    if (action === 'csv') downloadCSV();
    if (action === 'sheets') openInGoogleSheets();
    
    // Reset dropdown visually
    e.target.value = '';
  };

  const executeSearch = async (currentOffset = 0, isLoadMore = false) => {
    setLoading(true);
    try {
      // 1. Send paginated GET request to our Backend API
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const url = `${baseUrl}/api/leads?niche=${niche}&city=${city}&limit=${limit}&offset=${currentOffset}`;
      console.log(`Pinging backend: ${url}`);
      
      const response = await axios.get(url);
      const newLeads = response.data.leads || [];

      if (newLeads.length < limit) {
        // We've hit the absolute bottom of Google Maps! No more to load.
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isLoadMore) {
        setLeads(prevLeads => [...prevLeads, ...newLeads]); // Appeand to bottom of list
      } else {
        setLeads(newLeads); // Fresh search overlay
      }
      
    } catch (err) {
      console.error(err);
      alert('Failed to fetch data completely. Make sure your backed is ON.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSearch = (e) => {
    e.preventDefault();
    setLeads([]); // clear out old data
    executeSearch(0, false);
  };

  const handleLoadMore = () => {
    // Pass exactly how many we already have as the offset to grab the NEXT page securely
    executeSearch(leads.length, true);
  };

  return (
    <div className="container">
      <header>
        <h1>LeadGen SaaS</h1>
        <p>Advanced algorithmic local business discovery engine.</p>
      </header>
      
      <main>
        <form onSubmit={handleInitialSearch} className="search-box">
          <input 
            type="text" 
            value={niche} 
            onChange={(e) => setNiche(e.target.value)} 
            placeholder="Niche (e.g. gyms)" 
            required 
          />
          <input 
            type="text" 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            placeholder="City (e.g. Delhi)" 
            required 
          />
          
          <div className="limit-toggles">
            <span className="limit-label">Limit:</span>
            {[20, 40, 60].map(val => (
               <button 
                  key={val} 
                  type="button" 
                  className={`limit-btn ${limit === val ? 'active' : ''}`}
                  onClick={() => setLimit(val)}
               >
                 {val}
               </button>
            ))}
          </div>

          <button type="submit" disabled={loading}>
            {loading && leads.length === 0 ? 'Analyzing Market...' : 'Find Leads'}
          </button>
        </form>

        {leads.length === 0 && !loading && (
          <div className="empty-state">
            <h2 className="empty-title">Discover High-Intent Local Clients.</h2>
            <p className="empty-subtitle">
              Instantly track down businesses missing a website, social media, or good reviews. <br/>
              <em>Drop in a niche and watch the algorithm hunt.</em>
            </p>
          </div>
        )}

        {leads.length > 0 && (
           <div className="action-bar">
             <h2>Leads Found: {leads.length}</h2>
             <select onChange={handleExportSelect} className="export-btn" defaultValue="">
                <option value="" disabled hidden>⬇ Export Data...</option>
                <option value="csv">Download as CSV</option>
                <option value="sheets">Open in Google Sheets</option>
             </select>
           </div>
        )}

        <section className="results">
          <div className="lead-grid">
            {leads.map((lead, idx) => (
              <div 
                key={lead._id || idx} 
                className="lead-card"
                onClick={(e) => {
                  // If they click the website link, don't open Google Maps
                  if (e.target.tagName.toLowerCase() === 'a') return;
                  
                  // Construct dynamic Google Maps Search URL
                  const query = encodeURIComponent(`${lead.name} ${lead.address || city}`);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                }}
                style={{ cursor: 'pointer' }}
                title="Click to view on Google Maps"
              >
                
                {/* [NEW] Image Thumbnail Block */}
                {lead.thumbnail ? (
                   <img src={lead.thumbnail} alt={lead.name} className="lead-thumbnail" />
                ) : (
                   <div style={{ background: '#f8d7da', color: '#721c24', padding: '30px 10px', textAlign: 'center', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                     ❌ No Image on Google
                   </div>
                )}

                <div className="lead-info">
                  <h3>{lead.name}</h3>
                  <p>Phone: {lead.phone || <span className="missing-alert">Missing</span>}</p>
                  <p>Website: {lead.website ? <a href={lead.website} target="_blank" rel="noreferrer">Yes</a> : <span className="missing-alert">Missing</span>}</p>
                  <p>Rating: ⭐ {lead.rating || 'N/A'} ({lead.reviewCount || 0} reviews)</p>
                </div>
              </div>
            ))}
          </div>

          {leads.length > 0 && hasMore && (
            <div className="load-more-container">
               <button onClick={handleLoadMore} disabled={loading} className="load-more-btn">
                 {loading ? 'Digging deeper...' : `Load Next ${limit} Leads 🔄`}
               </button>
            </div>
          )}
          
          {!hasMore && leads.length > 0 && (
             <p className="bottom-message">No more local businesses found in this area.</p>
          )}

        </section>
      </main>
    </div>
  );
}

export default App;
