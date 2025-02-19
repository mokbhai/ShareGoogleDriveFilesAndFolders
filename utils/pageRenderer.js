import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { hitCounter } from "./hitCounter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RENDERED_DIR = path.join(__dirname, "..", "rendered");

export const pageRenderer = {
  async getRenderedPage(url, isMobile) {
    try {
      const filePath = this.getFilePath(url, isMobile);
      const content = await fs.readFile(filePath, "utf-8");
      await hitCounter.incrementHit(this.getStatsKey(url, isMobile));
      return content;
    } catch (error) {
      return null;
    }
  },

  async savePage(url, content, isMobile) {
    try {
      const filePath = this.getFilePath(url, isMobile);
      await this.ensureRenderedDir();
      await fs.writeFile(filePath, content, "utf-8");
    } catch (error) {
      console.error("Error saving rendered page:", error);
    }
  },

  async clearCache() {
    try {
      await this.ensureRenderedDir();
      const files = await fs.readdir(RENDERED_DIR);
      await Promise.all(
        files.map((file) => fs.unlink(path.join(RENDERED_DIR, file)))
      );
      return { success: true, message: "Cache cleared successfully" };
    } catch (error) {
      console.error("Error clearing cache:", error);
      return { success: false, error: error.message };
    }
  },

  getFilePath(url, isMobile) {
    // Convert URL to a valid filename with device type
    const fileName = `${url
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase()
      .slice(0, 180)}_${isMobile ? "mobile" : "desktop"}`;
    return path.join(RENDERED_DIR, `${fileName}.html`);
  },

  getStatsKey(url, isMobile) {
    return `${url}|${isMobile ? "mobile" : "desktop"}`;
  },

  async ensureRenderedDir() {
    try {
      await fs.access(RENDERED_DIR);
    } catch {
      await fs.mkdir(RENDERED_DIR, { recursive: true });
    }
  },

  async getPageStats() {
    const hits = await hitCounter.getAllHits();
    const stats = [];

    for (const [key, count] of Object.entries(hits)) {
      try {
        const [url, device] = key.split("|");
        const filePath = this.getFilePath(url, device === "mobile");
        const exists = await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false);

        stats.push({
          url,
          device,
          hits: count,
          cached: exists,
          lastAccessed: exists ? (await fs.stat(filePath)).mtime : null,
        });
      } catch (error) {
        console.error(`Error getting stats for ${key}:`, error);
      }
    }

    return stats.sort((a, b) => b.hits - a.hits);
  },
};
