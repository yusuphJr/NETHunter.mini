document.getElementById('qr-btn').onclick = () => {
  fetch('/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: 'temp' }) // Fallback
  })
    .then(res => res.json())
    .then(data => {
      if (data.qr) {
        document.getElementById('output').innerHTML = `<img src="${data.qr}" />`;
      }
    });
};

document.getElementById('phone-btn').onclick = () => {
  const phone = document.getElementById('phone').value.trim();
  fetch('/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('output').innerHTML = `✅ Logged in as ${phone}`;
      } else if (data.qr) {
        document.getElementById('output').innerHTML = `<img src="${data.qr}" />`;
      } else {
        document.getElementById('output').innerText = `Waiting...`;
      }
    });
};
