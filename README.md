# 🕷 SpiderScann v3.0
**Outil de Diagnostic Réseau Professionnel**  
*by Anony'x — +226 03 99 64 69*

---

## 📦 Structure du projet

```
spiderscann/
├── server.js          ← Serveur Node.js (backend API)
├── package.json       ← Dépendances Node.js
├── README.md          ← Ce fichier
└── public/
    └── index.html     ← Frontend (interface web)
```

---

## 🚀 Installation & Lancement

### 1. Cloner le projet
```bash
git clone https://github.com/TON_USERNAME/spiderscann.git
cd spiderscann
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer le serveur
```bash
node server.js
```

### 4. Ouvrir dans le navigateur
```
http://localhost:3000
```

---

## 🌐 Déploiement sur Railway (recommandé)

1. Créer un compte sur [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Sélectionner ce repo
4. Railway détecte automatiquement Node.js et lance `npm start`
5. Copier l'URL publique générée (ex: `https://spiderscann.railway.app`)
6. Dans `public/index.html`, ligne `const API = ...`, remplacer par ton URL :
   ```js
   const API = 'https://spiderscann.railway.app';
   ```

## 🌐 Déploiement sur Render

1. Créer un compte sur [render.com](https://render.com)
2. New → Web Service → connecter ton repo GitHub
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Copier l'URL et la mettre dans `public/index.html`

---

## 🔧 API Endpoints

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/health` | GET | Statut du serveur |
| `/api/hosts` | POST | Host Checker HTTP/HTTPS |
| `/api/ports` | POST | Port Scanner TCP |
| `/api/dns` | GET | DNS Lookup |
| `/api/ping` | GET | Ping & Latence |
| `/api/geoip` | GET | GeoIP Info |
| `/api/ssl` | GET | SSL/TLS Checker |
| `/api/whois` | GET | WHOIS / RDAP |

---

## 🛠 Fonctionnalités

### 🌐 Online (via serveur Node.js)
- ✅ **Host Checker** — Vérification HTTP/HTTPS réelle (code status, temps réponse)
- ✅ **Port Scanner** — Scan TCP réel via `net.Socket` (pas de limitation navigateur)
- ✅ **DNS Lookup** — A, AAAA, MX, TXT, NS, CNAME, SOA via module `dns` natif
- ✅ **IP / GeoIP** — Géolocalisation complète (ville, pays, FAI, ASN, coordonnées)
- ✅ **SSL/TLS** — Vérification HTTPS + certificat via crt.sh
- ✅ **Ping & Latence** — Mesure TCP réelle (min, max, moyenne, pertes)
- ✅ **WHOIS** — Registrar, dates expiration, DNS via protocole RDAP

### 📡 Offline (100% navigateur, sans connexion)
- ✅ **Calculateur CIDR** — Sous-réseau, masque, broadcast, nb hôtes
- ✅ **Analyseur IP** — Type (privée/publique), classe, binaire, hex
- ✅ **Encodeur/Décodeur** — Base64, URL, Hex
- ✅ **Hash SHA** — SHA-256, SHA-512 via WebCrypto
- ✅ **Référence des Ports** — Base de données 29+ ports TCP

---

## 🎨 Interface
- Thème sombre / clair
- 5 couleurs d'accent (vert, bleu, violet, orange, rouge)
- Navigation mobile bottom bar
- 100% responsive Android/iOS
- Guide complet intégré

---

## 👨‍💻 Créateur

**Anony'x** — Développeur · Sécurité Réseau · Burkina Faso 🇧🇫  
📱 WhatsApp: [+226 03 99 64 69](https://wa.me/22603996469)

---

## ⚠️ Usage Responsable
Cet outil est destiné aux administrateurs système, auditeurs de sécurité et professionnels IT pour analyser **leur propre infrastructure**. Ne pas utiliser sur des systèmes tiers sans autorisation.
