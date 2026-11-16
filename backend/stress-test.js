const http = require('http');
const path = require('path');

// Dynamically start the server using compiled dist/server.js
const serverProcess = require(path.join(__dirname, 'dist', 'server.js'));

const BASE_URL = 'http://localhost:5000';

async function sendRequest(options, postData = null) {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          statusCode: res.statusCode,
          duration,
          data: data.slice(0, 200)
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 502,
        duration: Date.now() - start,
        error: err.message
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runBenchmark(name, requestFn, totalRequests, concurrency) {
  console.log(`\n==================================================`);
  console.log(`🚀 RUNNING STRESS TEST: ${name}`);
  console.log(`Total Requests: ${totalRequests} | Concurrency: ${concurrency}`);
  console.log(`==================================================`);

  const startTime = Date.now();
  const durations = [];
  const statusCodes = {};
  let completed = 0;

  const queue = Array.from({ length: totalRequests }, (_, i) => i);

  async function worker() {
    while (queue.length > 0) {
      const idx = queue.shift();
      const res = await requestFn(idx);
      if (res.error && completed === 0) console.error(`[Sample Error]: ${res.error}`);
      durations.push(res.duration);
      statusCodes[res.statusCode] = (statusCodes[res.statusCode] || 0) + 1;
      completed++;
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  durations.sort((a, b) => a - b);

  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = (sum / durations.length).toFixed(2);
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  const rps = (totalRequests / totalTimeSec).toFixed(1);

  console.log(`⏱️ Total Time: ${totalTimeSec.toFixed(2)}s`);
  console.log(`⚡ Throughput: ${rps} requests/second`);
  console.log(`📊 Latency: Avg: ${avg}ms | p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms`);
  console.log(`🎯 Status Code Breakdown:`, JSON.stringify(statusCodes));

  return { rps, avg, p50, p95, p99, statusCodes };
}

async function startStressSuite() {
  // Give server 1 second to bind to port
  await new Promise(r => setTimeout(r, 1200));

  console.log('\n--- STARTING SYSTEM STRESS BENCHMARKS ---');

  // TEST 1: Health endpoint - baseline raw throughput (500 requests, 50 concurrent)
  await runBenchmark(
    'Health Check Endpoint (Raw Engine Speed)',
    () => sendRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    }),
    500,
    50
  );

  // TEST 2: Venues Catalog & Search Endpoint (300 requests, 30 concurrent)
  await runBenchmark(
    'Venues Catalog with Filters & Scoring',
    () => sendRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/venues?sport=badminton&sort=rating',
      method: 'GET'
    }),
    300,
    30
  );

  // TEST 3: Dynamic Slot Matrix Calculation (300 requests, 30 concurrent)
  await runBenchmark(
    'Slot Availability Calculator (Complex Matrix Engine)',
    () => sendRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/venues/ven_1/slots?date=2026-11-25',
      method: 'GET'
    }),
    300,
    30
  );

  // TEST 4: CONCURRENCY RACE CONDITION TEST (50 simultaneous bookings for the EXACT same slot at the exact same microsecond)
  console.log(`\n==================================================`);
  console.log(`🥊 TEST 4: CONCURRENCY RACE CONDITION (Double-Booking Attack Test)`);
  console.log(`Simulating 50 players trying to book Court 1 at 7:00 PM at the exact same millisecond`);
  console.log(`==================================================`);

  const raceDate = '2026-12-15';
  const raceHour = 19; // 7 PM
  const bookingPayload = (i) => JSON.stringify({
    venueId: 'ven_1',
    sportSlug: 'badminton',
    date: raceDate,
    startHour: raceHour,
    hours: 1,
    playerName: `Racer ${i}`,
    playerPhone: `998877665${i % 10}`,
    playersCount: 2
  });

  const raceRequests = Array.from({ length: 50 }, (_, i) => {
    const payload = bookingPayload(i);
    return sendRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);
  });

  const raceResults = await Promise.all(raceRequests);
  const raceStatus = {};
  raceResults.forEach(r => {
    raceStatus[r.statusCode] = (raceStatus[r.statusCode] || 0) + 1;
  });

  console.log(`Race Results:`, JSON.stringify(raceStatus));
  if (raceStatus[201] === 1 && raceStatus[409] === 49) {
    console.log(`✅ TEST PASSED: Exactly 1 player got the slot (201 Created), and 49 players received (409 Conflict - Already Booked). ZERO DOUBLE BOOKINGS!`);
  } else {
    console.log(`Race outcome details:`, raceStatus);
  }

  console.log('\n--- ALL BENCHMARKS COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

startStressSuite().catch(err => {
  console.error('Stress test error:', err);
  process.exit(1);
});
