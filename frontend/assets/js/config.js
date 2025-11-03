// Mock mode configuration
window.MOCK_MODE = true; // Set to false when server is working

window.BASE_URL = window.MOCK_MODE ? '' : (
  window.location.hostname.includes('localhost')
    ? 'http://localhost:5000'
    : 'https://drnet.co.ke'
);

window.APP_CONFIG = {
  siteName: "DrNet Admin" + (window.MOCK_MODE ? " (Mock Mode)" : ""),
  version: "1.0.0"
};