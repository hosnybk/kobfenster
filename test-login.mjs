
const PORT = 5174
const url = `http://localhost:${PORT}/api/auth/login`

async function test() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Empty body
    })
    console.log('Status:', res.status)
    const data = await res.json()
    console.log('Response:', data)
  } catch (e) {
    console.error('Error:', e)
  }
}

test()
