export async function pingBackend() {
    const res = await fetch("http://192.168.10.18:8000/");
    const data = await res.json();
    console.log(data); // Should show { message: "Hello from FastAPI!" }
  }