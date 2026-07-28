import http from 'http';
import https from 'https';

const API_URL = 'http://localhost:10311';

async function runPenetrationTest() {
  console.log('--- LIVE API PENETRATION & CSRF TEST ---');
  
  // 1. CSRF Verification
  console.log('\n[1] Verifying CSRF Protection...');
  
  // A request without CSRF
  const loginResNoCsrf = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ahansk.com', password: 'password123' })
  });
  
  console.log(`POST /auth/login without CSRF -> Status: ${loginResNoCsrf.status}`);
  if (loginResNoCsrf.status === 403) {
    console.log('✅ PASS: CSRF rejected mutating request without token.');
  } else {
    console.error('❌ FAIL: CSRF did not reject the request.');
  }

  // Fetch CSRF Token via GET request
  const csrfRes = await fetch(`${API_URL}/news`);
  const setCookie = csrfRes.headers.get('set-cookie') || '';
  const csrfCookie = setCookie.split(',').find(c => c.includes('csrf_token=')) || setCookie;
  
  // Extract token from cookie string (csrf_token=abc123def456; Path=/...)
  const csrfTokenMatch = csrfCookie.match(/csrf_token=([^;]+)/);
  const csrfToken = csrfTokenMatch ? csrfTokenMatch[1] : null;
  
  console.log(`Obtained CSRF Token: ${csrfToken ? csrfToken.substring(0, 10) : 'null'}...`);

  const tempEmail = `test_${Date.now()}@ahansk.com`;
  const tempPass = 'Password123!';

  // A request WITH CSRF to register
  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
      'Cookie': csrfCookie
    },
    body: JSON.stringify({ email: tempEmail, password: tempPass, name: 'Bombard User' })
  });

  console.log(`POST /auth/register WITH CSRF -> Status: ${registerRes.status}`);
  if (registerRes.status === 200 || registerRes.status === 201) {
    console.log('✅ PASS: Request accepted with valid CSRF token.');
  } else {
    console.error(`❌ FAIL: Registration failed with valid CSRF. Message: ${await registerRes.text()}`);
    return;
  }

  const authCookies = registerRes.headers.get('set-cookie') || '';
  const finalCookies = `${csrfCookie}; ${authCookies}`;

  // 2. Load Bombard (Concurrent Requests)
  console.log('\n[2] Executing Bombard Script (100 concurrent requests to authenticated endpoint)...');
  
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < 100; i++) {
    promises.push(
      fetch(`${API_URL}/users/me`, {
        headers: {
          'Cookie': finalCookies
        }
      }).then(r => r.status)
    );
  }

  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  const successCount = results.filter(status => status === 200).length;
  const failCount = results.length - successCount;
  
  console.log(`Executed 100 requests in ${endTime - startTime}ms`);
  console.log(`✅ Success: ${successCount}`);
  if (failCount > 0) {
    console.error(`❌ Failed: ${failCount}`);
  }

  console.log('\n--- TEST COMPLETE ---');
}

runPenetrationTest().catch(console.error);
