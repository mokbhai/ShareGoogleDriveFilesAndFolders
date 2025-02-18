import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HITS_FILE = path.join(__dirname, "..", "data", "hits.json");

export const hitCounter = {
  hits: {},

  async initialize() {
    try {
      await this.ensureDataDir();
      const content = await fs.readFile(HITS_FILE, "utf-8");
      this.hits = JSON.parse(content);
    } catch (error) {
      this.hits = {};
      await this.saveHits();
    }
  },

  async incrementHit(url) {
    this.hits[url] = (this.hits[url] || 0) + 1;
    await this.saveHits();
    return this.hits[url];
  },

  async getHits(url) {
    return this.hits[url] || 0;
  },

  async getAllHits() {
    return { ...this.hits };
  },

  async saveHits() {
    await this.ensureDataDir();
    await fs.writeFile(HITS_FILE, JSON.stringify(this.hits, null, 2));
  },

  async ensureDataDir() {
    const dataDir = path.dirname(HITS_FILE);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  },
};
