// Simple script to test Apify FB scraper output structure
const token = process.env.APIFY_API_TOKEN;
if (!token) {
  console.error("APIFY_API_TOKEN is missing in process.env!");
  process.exit(1);
}
const groupUrl = "https://www.facebook.com/groups/531451220380265";
const cookiesRaw = process.env.FB_COOKIES || '';

async function test() {
  console.log("Triggering Apify...");
  const input = {
    startUrls: [{ url: groupUrl }],
    resultsLimit: 3,
    viewOption: "CHRONOLOGICAL"
  };

  if (cookiesRaw) {
    try {
      input.cookies = JSON.parse(cookiesRaw);
      console.log(`Attached ${input.cookies.length} cookies.`);
    } catch (e) {
      console.error("Cookie parse error:", e);
    }
  }

  const res = await fetch(`https://api.apify.com/v2/acts/apify~facebook-groups-scraper/run-sync-get-dataset-items?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Items count:", data.length);
  if (data.length > 0) {
    console.log("First item keys:", Object.keys(data[0]));
    console.log("First item details:", JSON.stringify(data[0], null, 2));
  }
}

test();
