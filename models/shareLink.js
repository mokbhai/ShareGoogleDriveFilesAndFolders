import { readFile, writeFile, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LINKS_FILE = join(__dirname, "../data/shareLinks.json");

export class ShareLink {
  static async initialize() {
    try {
      // Check if file exists
      await access(LINKS_FILE);
    } catch (error) {
      // Create file with empty array if it doesn't exist
      await writeFile(LINKS_FILE, JSON.stringify([], null, 2));
      console.log("Created shareLinks.json file");
    }
  }

  static async getAll() {
    try {
      const data = await readFile(LINKS_FILE, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading share links:", error);
      return [];
    }
  }

  static async getByToken(token) {
    const links = await this.getAll();
    return links.find((link) => link.token === token);
  }

  static async create({ folderId, name, expiresAt = null }) {
    const links = await this.getAll();
    const token = crypto.randomBytes(32).toString("hex");

    const newLink = {
      token,
      folderId,
      name,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    links.push(newLink);
    await writeFile(LINKS_FILE, JSON.stringify(links, null, 2));
    return newLink;
  }

  static async delete(token) {
    const links = await this.getAll();
    const filteredLinks = links.filter((link) => link.token !== token);
    await writeFile(LINKS_FILE, JSON.stringify(filteredLinks, null, 2));
  }
}
