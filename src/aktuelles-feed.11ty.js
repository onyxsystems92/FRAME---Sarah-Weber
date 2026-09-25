// Exports the aktuelles collection (Sarah-editable markdown, authoritative
// source) to content/aktuelles.json — the exact CONTENT.md schema that
// script.js already fetches and filters client-side at runtime. This file
// is a generated build artifact, not a second source of truth.
module.exports = class {
  data() {
    return {
      permalink: "content/aktuelles.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render({ collections }) {
    const items = (collections.aktuelles || [])
      .filter((entry) => entry.data.status === "published")
      .map((entry) => ({
      id: entry.data.id,
      status: entry.data.status,
      title: entry.data.title,
      text: entry.data.text,
      publishedAt: entry.data.publishedAt || null,
      expiresAt: entry.data.expiresAt || null,
      showOnHomepage: !!entry.data.showOnHomepage,
    }));
    return JSON.stringify({ version: 1, items }, null, 2) + "\n";
  }
};
