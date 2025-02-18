import { pageRenderer } from "../utils/pageRenderer.js";

export const clearRenderedPages = async (req, res) => {
  try {
    const result = await pageRenderer.clearCache();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to clear rendered pages",
    });
  }
};
