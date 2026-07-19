const http = require("http");
const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/menu/items?limit=100",
  method: "GET",
  headers: {
    "x-tenant-id": "648a3e0a-93a7-4219-a667-33d38b4844e0"
  }
};
const req = http.request(options, res => {
  let data = "";
  res.on("data", d => data += d);
  res.on("end", () => {
    try {
      const parsed = JSON.parse(data);
      console.log("Total count:", parsed.pagination?.total);
      console.log("Returned items:", parsed.data?.length);
    } catch (e) {
      console.log("Error parsing:", data);
    }
  });
});
req.on("error", console.error);
req.end();
