import express from 'express';
import axios from 'axios';
import Lead from '../models/Lead.js';

const router = express.Router();



router.get('/', async (req, res) => {
  try {
    const { niche, city } = req.query;
    if (!niche || !city) return res.status(400).json({ error: 'Niche and city required.' });

    const queryKey = `${niche.toLowerCase().trim()}_${city.toLowerCase().trim()}`;
    // Dynamic Pagination Parameters
    const limit = parseInt(req.query.limit) || 20; // How many to fetch this time
    const offset = parseInt(req.query.offset) || 0; // Where to start fetching from

    console.log(`[REQUEST] ${queryKey} | Target Size: ${limit} | Start Offset: ${offset}`);

    // 1. CACHE CHECK
    // Fetch ALL existing leads we've ever cached for this query
    const cache = await Lead.find({ queryKey });
    
    // If the database cache ALREADY has enough data to perfectly fulfill this page request...
    if (cache.length >= offset + limit) {
      console.log(`[CACHE HIT] Returning leads ${offset} to ${offset + limit} from MongoDB`);
      const paginatedLeads = cache.slice(offset, offset + limit);
      return res.json({ source: 'database', count: paginatedLeads.length, leads: paginatedLeads, totalCached: cache.length });
    }

    // 2. LIVE DISCOVERY (Because Cache didn't have enough)
    const SERPAPI_KEY = process.env.SERPAPI_KEY;
    if (!SERPAPI_KEY) return res.status(401).json({ error: "SERPAPI_KEY required." });

    let allResults = [];
    // Only scrape the exact missing pages.
    // If offset is 40 and limit is 40, we only scrape start=40 and start=60.
    const fetchEnd = offset + limit; 
    
    for (let start = offset; start < fetchEnd; start += 20) {
      console.log(`[API SCRAPE] SerpApi Google Maps page starting at ${start}...`);
      const searchUrl = `https://serpapi.com/search.json?engine=google_maps&q=${niche}+in+${city}&start=${start}&api_key=${SERPAPI_KEY}`;
      
      try {
        const response = await axios.get(searchUrl);
        const pageResults = response.data.local_results || [];
        if (pageResults.length > 0) {
          allResults = allResults.concat(pageResults);
        } else {
          break; // Hit end of Google Maps results
        }
      } catch (err) {
        console.error(`Failed to fetch offset ${start}`);
        break; 
      }
    }

    if (allResults.length === 0) {
      // Return what we safely had in the cache if API fails or returns 0
      const safeFallback = cache.slice(offset) || [];
      return res.json({ source: 'live_api_empty', count: safeFallback.length, leads: safeFallback, message: 'Reached end of results.' });
    }

    // 3. MAP, SCORE & INCLUDE IMAGES
    const freshLeads = allResults.map(biz => {
      const leadData = {
        queryKey,
        name: biz.title || 'Unknown Business',
        address: biz.address,
        phone: biz.phone ? String(biz.phone).trim() : null,
        website: biz.website || (biz.links && biz.links.website) || null,
        rating: biz.rating,
        reviewCount: biz.reviews,
        thumbnail: biz.thumbnail || null, // UI Business Image
      };
      return leadData;
    });

    // Save newly scraped leads to cache
    const savedLeads = await Lead.insertMany(freshLeads);
    console.log(`[API CALL] Fetched and Saved ${savedLeads.length} NEW leads.`);
    
    return res.json({ source: 'live_api', count: savedLeads.length, leads: savedLeads, totalCached: cache.length + savedLeads.length });

  } catch (error) {
    console.error('Lead Fetching Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
