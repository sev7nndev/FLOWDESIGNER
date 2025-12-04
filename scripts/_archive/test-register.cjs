const fetch = require('node-fetch');

async function testRegisterMinimal() {
    const email = `test_min_${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`Trying to register minimal ${email}...`);

    try {
        const response = await fetch('http://localhost:3001/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName: "Test", lastName: "Min" }) // sending metadata, but maybe simple ones
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testRegisterMinimal();
