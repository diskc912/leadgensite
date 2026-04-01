import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const url = `https://serpapi.com/search.json?engine=google_local&q=plumbers+in+mumbai&api_key=${process.env.SERPAPI_KEY}`;
    const res = await axios.get(url);
    if(res.data && res.data.local_results && res.data.local_results.length > 0) {
      console.log(JSON.stringify(res.data.local_results[0], null, 2));
    } else {
      console.log('No local results found or API failed.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
