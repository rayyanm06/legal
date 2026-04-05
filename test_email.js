fetch('http://localhost:5000/api/send-lawyer-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lawyer: { name: 'Adv. Vikram Mehta', email: 'rayyanzaid1406@gmail.com', city: 'Delhi' },
    clientInfo: { name: 'Test User', phone: '1234567890', email: 'test@test.com', city: 'Test City' },
    category: 'Criminal Law',
    answers: { 'Nature of the offense': 'Test Offense', 'Has an FIR been filed?': 'No' }
  })
}).then(r => r.json()).then(console.log).catch(console.error);
