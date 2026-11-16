const { EventEmitter } = require('events');
const path = require('path');

// Import compiled express app
const app = require(path.join(__dirname, 'dist', 'server.js')).default || require(path.join(__dirname, 'dist', 'server.js'));

function createMockReq(options, body = null) {
  const req = new EventEmitter();
  req.method = options.method || 'GET';
  req.url = options.url || '/';
  req.headers = Object.assign({
    host: 'localhost:5000',
    'content-type': 'application/json'
  }, options.headers || {});

  req.body = body ? (typeof body === 'string' ? JSON.parse(body) : body) : {};
  return req;
}

function createMockRes() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res._headers = {};
  res.data = '';

  res.setHeader = (k, v) => { res._headers[k.toLowerCase()] = v; };
  res.getHeader = (k) => res._headers[k.toLowerCase()];
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.data = JSON.stringify(obj);
    res.emit('finish');
    return res;
  };
  res.send = (val) => {
    res.data = String(val);
    res.emit('finish');
    return res;
  };
  res.end = (val) => {
    if (val) res.data += val;
    res.emit('finish');
    return res;
  };

  return res;
}

function dispatch(options, body = null) {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = createMockReq(options, body);
    const res = createMockRes();

    res.on('finish', () => {
      resolve({
        statusCode: res.statusCode,
        duration: Date.now() - start,
        data: res.data
      });
    });

    try {
      app.handle(req, res);
    } catch (err) {
      resolve({
        statusCode: 500,
        duration: Date.now() - start,
        error: err.message
      });
    }
  });
}

async function runBenchmark(name, requestFn, totalRequests, concurrency) {
  console.log(`\n==================================================`);
  console.log(`🚀 STRESS TEST: ${name}`);
  console.log(`Requests: ${totalRequests} | Concurrency: ${concurrency}`);
  console.log(`==================================================`);

  const startTime = Date.now();
  const durations = [];
  const statusCodes = {};

  const queue = Array.from({ length: totalRequests }, (_, i) => i);

  async function worker() {
    while (queue.length > 0) {
      const idx = queue.shift();
      const res = await requestFn(idx);
      durations.push(res.duration);
      statusCodes[res.statusCode] = (statusCodes[res.statusCode] || 0) + 1;
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = Math.max(0.001, (Date.now() - startTime) / 1000);
  durations.sort((a, b) => a - b);

  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = (sum / durations.length).toFixed(2);
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  const rps = (totalRequests / totalTimeSec).toFixed(1);

  console.log(`⏱️ Total Execution Time: ${totalTimeSec.toFixed(3)}s`);
  console.log(`⚡ Throughput: ${rps} requests/second`);
  console.log(`📊 Latency: Avg: ${avg}ms | p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms`);
  console.log(`🎯 Status Code Breakdown:`, JSON.stringify(statusCodes));

  return { rps, avg, p50, p95, p99, statusCodes };
}

async function runAll() {
  console.log('\n--- 🧪 STARTING IN-PROCESS LOAD & CONCURRENCY BENCHMARK ---');

  // Test 1: Raw Health Check - 1,000 requests
  await runBenchmark(
    'Health Check Endpoint (Raw Engine Speed)',
    () => dispatch({ method: 'GET', url: '/api/health' }),
    1000,
    100
  );

  // Test 2: Venues Catalog & Search - 1,000 requests
  await runBenchmark(
    'Venues Catalog (Filter + Rating Sort + JSON serialization)',
    () => dispatch({ method: 'GET', url: '/api/venues?sport=badminton&sort=rating' }),
    1000,
    100
  );

  // Test 3: Complex Dynamic Slot Calculator - 1,000 requests
  await runBenchmark(
    'Slot Availability Matrix Calculation',
    () => dispatch({ method: 'GET', url: '/api/venues/ven_1/slots?date=2026-11-20' }),
    1000,
    100
  );

  // Test 4: Concurrency Double-Booking Attack - 100 simultaneous bookings for the EXACT same slot
  console.log(`\n==================================================`);
  console.log(`🥊 TEST 4: CONCURRENCY RACE CONDITION (Double-Booking Prevention Test)`);
  console.log(`Simulating 100 players attempting to book the EXACT SAME slot at the same millisecond`);
  console.log(`==================================================`);

  const raceDate = '2026-12-25';
  const raceHour = 18;

  const racePromises = Array.from({ length: 100 }, (_, i) => {
    return dispatch({
      method: 'POST',
      url: '/api/bookings'
    }, {
      venueId: 'ven_1',
      sportSlug: 'badminton',
      date: raceDate,
      startHour: raceHour,
      hours: 1,
      playerName: `Simulated Racer ${i + 1}`,
      playerPhone: `998877665${i % 10}`,
      playersCount: 2
    });
  });

  const raceResults = await Promise.all(racePromises);
  const raceStatus = {};
  raceResults.forEach(r => {
    raceStatus[r.statusCode] = (raceStatus[r.statusCode] || 0) + 1;
  });

  console.log(`Race Outcome:`, JSON.stringify(raceStatus));
  if (raceStatus[201] === 1 && raceStatus[409] === 99) {
    console.log(`🏆 PERFECT PASS: Exactly 1 player was confirmed (201 Created), and 99 players were rejected (409 Conflict - Already Booked).`);
    console.log(`🛡️ ZERO DOUBLE-BOOKING DETECTED! Concurrency lock held 100%.`);
  } else {
    console.log(`Race details:`, raceStatus);
  }

  console.log('\n--- ✅ ALL 3,100 STRESS REQUESTS COMPLETED ---');
  process.exit(0);
}

runAll().catch(err => {
  console.error(err);
  process.exit(1);
});
