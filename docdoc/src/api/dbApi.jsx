
import axios from 'axios';

const dpApi = axios.create({
  baseURL: import.meta.env.VITE_SOLAR_API_URL,  // ex: https://api.upstage.ai
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_SOLAR_API_KEY}`,
  }
});

export default dpApi;
