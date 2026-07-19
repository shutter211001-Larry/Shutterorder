const http = require("http");
const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/menu/categories",
  method: "GET",
  headers: {
    "x-tenant-id": "clzytenantid"
  }
};
http.request(options, res => {
  let data = "";
  res.on("data", d => data += d);
  res.on("end", () => console.log(res.statusCode, data));
}).end();
