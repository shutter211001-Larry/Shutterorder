const http = require("https");
const urls = [
  "/api/menu/categories",
  "/api/menu/allergens",
  "/api/menu/mealtimes",
  "/api/menu/dietary",
  "/api/locations"
];
urls.forEach(url => {
  http.get("https://api.pizzastudio26.com" + url, res => {
    console.log(url, res.statusCode);
  });
});
