// Google Maps for the "Our Location" section (used by index.html and contact.html)
(function () {
  const API_KEY = "AIzaSyCAn86lhxjgvEOIQXpCiIgj81s2GOXWERk";
  const ADDRESS = "1400 rue de Guise, La Prairie, QC J5R 5W6";
  const LOCATION = { lat: 45.4147, lng: -73.4497 }; // La Prairie

  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  // Backup: keyless Google Maps embed, used if the JS API fails (bad key, billing, etc.)
  function showFallback(reason) {
    console.warn("Google Maps JS API failed (" + reason + "). Showing embedded map instead.");
    mapEl.innerHTML =
      '<iframe title="Groupe Dan Inc." width="100%" height="100%" style="border:0;border-radius:8px" ' +
      'loading="lazy" referrerpolicy="no-referrer-when-downgrade" ' +
      'src="https://www.google.com/maps?q=' + encodeURIComponent(ADDRESS) + '&output=embed"></iframe>';
  }

  // Google calls this when the API key is rejected
  window.gm_authFailure = function () { showFallback("API key rejected"); };

  window.initMap = function () {
    const map = new google.maps.Map(mapEl, { zoom: 15, center: LOCATION });
    new google.maps.Marker({ position: LOCATION, map: map, title: "Groupe Dan Inc." });
  };

  const script = document.createElement("script");
  script.src = "https://maps.googleapis.com/maps/api/js?key=" + API_KEY + "&callback=initMap&loading=async";
  script.async = true;
  script.onerror = function () { showFallback("script failed to load"); };
  document.head.appendChild(script);
})();
