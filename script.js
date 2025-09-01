let map = L.map('map').setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let markers = [];

// Custom cafe icon ☕
const cafeIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/924/924514.png", // coffee cup icon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30]
});

async function geocodeCity(city) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${city}&country=India&format=json`);
  const data = await res.json();
  return data.length ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
}

async function fetchCafes(lat, lon) {
  const query = `
  [out:json];
  node["amenity"="cafe"](around:2500,${lat},${lon});
  out;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query
  });
  return (await res.json()).elements;
}

function clearMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

function showCafes(cafes) {
  clearMarkers();
  const cafeList = document.getElementById("cafeList");
  cafeList.innerHTML = "";

  if (cafes.length === 0) {
    cafeList.innerHTML = "<p>No cafes found nearby ☹️</p>";
    return;
  }

  cafes.forEach((cafe, index) => {
    const marker = L.marker([cafe.lat, cafe.lon], { icon: cafeIcon }).addTo(map);
    marker.bindPopup(`
      <b>${cafe.tags.name || "Unnamed Cafe"}</b><br>
      ☕ Type: Cafe<br>
      📍 ${cafe.tags["addr:street"] || "Address not available"}
    `);
    markers.push(marker);

    const card = document.createElement("div");
    card.className = "cafe-card";
    card.innerHTML = `
      <h3>${cafe.tags.name || "Unnamed Cafe"}</h3>
      <p>📍 ${cafe.tags["addr:street"] || "No address"}</p>
      <p>☕ ${cafe.tags.cuisine || "Cafe Vibes"}</p>
    `;
    card.onclick = () => {
      map.setView([cafe.lat, cafe.lon], 18);
      marker.openPopup();
    };
    cafeList.appendChild(card);

    setTimeout(() => card.classList.add("show"), 150 * index);
  });
}

async function handleSearch() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return;

  document.getElementById("loading").style.display = "block";
  const coords = await geocodeCity(city);
  if (coords) {
    map.setView(coords, 14);
    const cafes = await fetchCafes(coords[0], coords[1]);
    showCafes(cafes);
  } else {
    alert("City not found!");
  }
  document.getElementById("loading").style.display = "none";
}

document.getElementById("searchBtn").addEventListener("click", handleSearch);
document.getElementById("cityInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

// 🔄 Reset view when logo is clicked
document.getElementById("logo").addEventListener("click", (e) => {
  e.preventDefault();

  // Reset map to default view (India zoomed out)
  map.setView([20.5937, 78.9629], 5);

  // Clear cafe list
  document.getElementById("cafeList").innerHTML = "";

  // Clear markers properly
  clearMarkers();
});
