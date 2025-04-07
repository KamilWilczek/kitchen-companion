import { API_URL } from '@env';

export async function pingBackend() {
    const res = await fetch(`${API_URL}`);
    const data = await res.json();
    console.log(data); // Should show { message: "Hello from FastAPI!" }
  }