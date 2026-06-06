/**
 * SpiderScann — Serveur Backend Node.js
 * by Anony'x | +226 03 99 64 69
 * Outil de diagnostic réseau pour administrateurs système
 */

const express = require('express');
const cors    = require('cors');
const dns     = require('dns').promises;
const net     = require('net');
const https   = require('https');
const http    = require('http');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════
//  UTILITAIRES
// ══════════════════════════════════════

// Mesure le temps de réponse HTTP(S) d'un host
function checkHost(host, proto = 'https', timeout = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const mod   = proto === 'https' ? https : http;
    const url   = `${proto}://${host}`;

    const req = mod.get(url, { timeout }, (res) => {
      const ms = Date.now() - start;
      res.destroy();
      resolve({ ok: true, status: res.statusCode, ms, url });
    });

    req.on('error', () => {
      resolve({ ok: false, status: null, ms: Date.now() - start, url });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 'timeout', ms: timeout, url });
    });
  });
}

// Teste si un port TCP est ouvert
function probePort(host, port, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (open) => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(open);
      }
    };

    socket.setTimeout(timeout);
    socket.connect(port, host, () => finish(true));
    socket.on('error', () => finish(false));
    socket.on('timeout', () => finish(false));
  });
}

// Résolution DNS complète
async function dnsLookup(hostname, type) {
  try {
    let records = [];
    switch (type) {
      case 'A':     records = await dns.resolve4(hostname, { ttl: true }); break;
      case 'AAAA':  records = await dns.resolve6(hostname, { ttl: true }); break;
      case 'MX':    records = await dns.resolveMx(hostname); break;
      case 'TXT':   records = await dns.resolveTxt(hostname); break;
      case 'NS':    records = await dns.resolveNs(hostname); break;
      case 'CNAME': records = await dns.resolveCname(hostname); break;
      case 'SOA':   records = [await dns.resolveSoa(hostname)]; break;
      default:      records = await dns.resolve(hostname);
    }
    return { ok: true, type, records };
  } catch (e) {
    return { ok: false, type, error: e.message };
  }
}

// Ping HTTP (mesure latence)
function pingHost(host, timeout = 3000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(`https://${host}`, { timeout }, (res) => {
      res.destroy();
      resolve({ ok: true, ms: Date.now() - start });
    });
    req.on('error', () => resolve({ ok: false, ms: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, ms: timeout }); });
  });
}

// ══════════════════════════════════════
//  ROUTES API
// ══════════════════════════════════════

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0.0', author: "Anony'x" });
});

// ── HOST CHECKER ──
// POST /api/hosts
// Body: { hosts: ["google.com", ...], proto: "https"|"http"|"both" }
app.post('/api/hosts', async (req, res) => {
  const { hosts = [], proto = 'https' } = req.body;

  if (!hosts.length) {
    return res.status(400).json({ error: 'Aucun host fourni.' });
  }

  const tasks = [];
  for (const host of hosts.slice(0, 100)) {
    const protos = proto === 'both' ? ['https', 'http'] : [proto];
    for (const p of protos) {
      tasks.push(checkHost(host.trim(), p).then(r => ({ host: host.trim(), proto: p, ...r })));
    }
  }

  const results = await Promise.all(tasks);
  res.json({ results });
});

// ── PORT SCANNER ──
// POST /api/ports
// Body: { host: "example.com", ports: [80, 443, 22, ...] }
app.post('/api/ports', async (req, res) => {
  const { host, ports = [] } = req.body;

  if (!host) return res.status(400).json({ error: 'Host manquant.' });
  if (!ports.length) return res.status(400).json({ error: 'Ports manquants.' });
  // Limite de sécurité : max 500 ports
  const limitedPorts = ports.slice(0, 500);

  const BATCH = 20;
  const results = [];

  for (let i = 0; i < limitedPorts.length; i += BATCH) {
    const chunk = limitedPorts.slice(i, i + BATCH);
    const batch = await Promise.all(
      chunk.map(async (port) => {
        const open = await probePort(host, port);
        return { port, open };
      })
    );
    results.push(...batch);
  }

  res.json({ host, results });
});

// ── DNS LOOKUP ──
// GET /api/dns?host=example.com&type=A
app.get('/api/dns', async (req, res) => {
  const { host, type = 'A' } = req.query;
  if (!host) return res.status(400).json({ error: 'Host manquant.' });

  const types = type === 'ALL'
    ? ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA']
    : [type.toUpperCase()];

  const results = await Promise.all(types.map(t => dnsLookup(host, t)));
  res.json({ host, results });
});

// ── PING ──
// GET /api/ping?host=google.com&count=10
app.get('/api/ping', async (req, res) => {
  const { host, count = 10 } = req.query;
  if (!host) return res.status(400).json({ error: 'Host manquant.' });

  const n = Math.min(parseInt(count) || 10, 50);
  const times = [];

  for (let i = 0; i < n; i++) {
    const r = await pingHost(host);
    times.push({ seq: i + 1, ...r });
    if (i < n - 1) await new Promise(r => setTimeout(r, 300));
  }

  const successful = times.filter(t => t.ok).map(t => t.ms);
  const stats = successful.length
    ? {
        min:  Math.min(...successful),
        max:  Math.max(...successful),
        avg:  Math.round(successful.reduce((a, b) => a + b, 0) / successful.length),
        loss: Math.round(((n - successful.length) / n) * 100),
      }
    : { min: 0, max: 0, avg: 0, loss: 100 };

  res.json({ host, count: n, times, stats });
});

// ── WHOIS / RDAP ──
// GET /api/whois?host=example.com
app.get('/api/whois', async (req, res) => {
  const { host } = req.query;
  if (!host) return res.status(400).json({ error: 'Host manquant.' });

  // Utilise l'API RDAP publique
  const fetch = require('node-fetch');
  try {
    const r    = await fetch(`https://rdap.org/domain/${encodeURIComponent(host)}`);
    const data = await r.json();
    res.json({ ok: true, data });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// ── GeoIP ──
// GET /api/geoip?ip=8.8.8.8
app.get('/api/geoip', async (req, res) => {
  const { ip = '' } = req.query;
  const fetch = require('node-fetch');
  try {
    const url  = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
    const r    = await fetch(url);
    const data = await r.json();
    res.json({ ok: true, data });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// ── SSL CHECK ──
// GET /api/ssl?host=example.com
app.get('/api/ssl', async (req, res) => {
  const { host } = req.query;
  if (!host) return res.status(400).json({ error: 'Host manquant.' });

  const fetch = require('node-fetch');
  let httpsOk = false;
  let ms      = 0;
  let cert    = null;

  // Test connexion HTTPS
  try {
    const t0  = Date.now();
    await fetch(`https://${host}`, { timeout: 5000 });
    ms      = Date.now() - t0;
    httpsOk = true;
  } catch {}

  // Récupère infos certificat depuis crt.sh
  try {
    const r     = await fetch(`https://crt.sh/?q=${encodeURIComponent(host)}&output=json`);
    const certs = await r.json();
    if (certs && certs.length) {
      cert = certs.sort((a, b) => new Date(b.not_before) - new Date(a.not_before))[0];
    }
  } catch {}

  res.json({ host, httpsOk, ms, cert });
});

// ── CATCH-ALL → index.html ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ──
app.listen(PORT, () => {
  console.log(`\n🕷  SpiderScann v3.0 — by Anony'x`);
  console.log(`📡  Serveur actif → http://localhost:${PORT}`);
  console.log(`🔧  API disponible sur /api/*\n`);
});
