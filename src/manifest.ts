const manifest = {
  manifest_version: 3,
  name: "YFanValue",
  description: "Extension to display player values in dollar amounts on Yahoo Fantasy pages",
  version: "0.1.0",
  icons: {
    "16": "icons/YFanValue.png",
    "32": "icons/YFanValue.png",
    "48": "icons/YFanValue.png",
    "128": "icons/YFanValue.png"
  },
  options_page: "src/options/index.html",
  background: {
    service_worker: "src/background/background.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["https://baseball.fantasysports.yahoo.com/b1/*"],
      js: ["src/content/playerValue.ts"]
    }
  ],
  host_permissions: [
    "https://prod-elneunie-fantasybaseballleaguestats.s3.us-east-2.amazonaws.com/*",
    "https://*/*",
    "http://localhost/*"
  ],
  permissions: ["storage"]
} satisfies chrome.runtime.ManifestV3;

export default manifest;
