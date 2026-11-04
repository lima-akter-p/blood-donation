const RENDER_API_URL = "https://blood-donation-xf4n.onrender.com";
const developmentApiUrl = import.meta.env.VITE_API_URL?.trim() || "/api";

export const API_BASE_URL = (
  import.meta.env.DEV ? developmentApiUrl : RENDER_API_URL
).replace(/\/+$/, "");
