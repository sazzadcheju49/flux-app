(function() {
  window.open = function() { return null; };
  setInterval(() => {
    document.querySelectorAll('iframe[src*="ad"], a[target="_blank"]').forEach(el => el.remove());
  }, 1000);
})();
