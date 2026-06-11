import axios from 'axios';

async function testChat() {
  try {
    const res = await axios.post('https://mindandbodyresetcoach.com/api/chat', {
      messages: [{ role: 'user', content: 'Hello' }]
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Referer': 'https://mindandbodyresetcoach.com/'
      }
    });
    console.log("Status:", res.status);
    console.log("Data:", res.data);
  } catch (err: any) {
    if (err.response) {
      console.error("HTTP Error:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

testChat();
