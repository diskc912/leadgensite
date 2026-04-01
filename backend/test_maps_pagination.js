import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const url = `https://serpapi.com/search.json?engine=google_maps&q=cafes+in+delhi&start=0&api_key=${process.env.SERPAPI_KEY}`;
    const res = await axios.get(url);
    if(res.data && res.data.local_results && res.data.local_results.length > 0) {
      console.log(JSON.stringify(res.data.local_results.slice(0, 3), null, 2));
    } else {
      console.log('No local results found.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
