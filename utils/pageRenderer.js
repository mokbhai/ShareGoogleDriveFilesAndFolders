import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RENDERED_DIR = path.join(__dirname, "..", "rendered");

export const pageRenderer = {
  async getRenderedPage(url) {
    try {
      const filePath = this.getFilePath(url);
      const content = await fs.readFile(filePath, "utf-8");
      return content;
    } catch (error) {
      return null;
    }
  },

  async savePage(url, content) {
    try {
      const filePath = this.getFilePath(url);
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

  getFilePath(url) {
    // Convert URL to a valid filename
    const fileName = url
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase()
      .slice(0, 200);
    return path.join(RENDERED_DIR, `${fileName}.html`);
  },

  async ensureRenderedDir() {
    try {
      await fs.access(RENDERED_DIR);
    } catch {
      await fs.mkdir(RENDERED_DIR, { recursive: true });
    }
  },
};
