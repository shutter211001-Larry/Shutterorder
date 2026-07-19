const http = require("http");
const body = JSON.stringify({
  orderType: "PICKUP",
  items: [{
    menuItemId: "cmre8krv7001t104hl7e43z2q",
    quantity: 1,
    options: []
  }],
});
const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/orders",
  method: "POST",
  headers: {
    "x-tenant-id": "demo-tenant-id",
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  }
};
const req = http.request(options, res => {
  let data = "";
  res.on("data", d => data += d);
  res.on("end", () => console.log(res.statusCode, data));
});
req.write(body);
req.end();
