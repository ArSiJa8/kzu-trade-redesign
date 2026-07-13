# KZU-TRAADE – Vollständige Backend-Dokumentation für das neue Frontend

> **Für Beginner geschrieben.** Du findest hier alles, was du brauchst, um ein neues Frontend zu bauen, das mit diesem Server kommuniziert. Kein Vorwissen nötig.

---

## Inhaltsverzeichnis

1. [Was ist dieser Server?](#1-was-ist-dieser-server)
2. [Wie funktioniert die Kommunikation?](#2-wie-funktioniert-die-kommunikation)
3. [Authentifizierung (Login / Token)](#3-authentifizierung-login--token)
4. [Umgebungsvariablen (Environment Variables)](#4-umgebungsvariablen)
5. [Datenbankstruktur](#5-datenbankstruktur)
6. [Datentypen (TypeScript)](#6-datentypen-typescript)
7. [Alle API-Endpunkte im Detail](#7-alle-api-endpunkte-im-detail)
    - [POST /api/register](#post-apiregister)
    - [POST /api/login](#post-apilogin)
    - [GET /api/images](#get-apiimages)
    - [POST /api/upload](#post-apiupload)
    - [POST /api/delete](#post-apidelete)
    - [GET /api/messages](#get-apimessages)
    - [POST /api/messages](#post-apimessages)
    - [POST /api/feedback](#post-apifeedback)
    - [POST /api/heartbeat](#post-apiheartbeat)
    - [GET /api/admin/stats](#get-apiadminstats)
    - [POST /api/admin/stats](#post-apiadminstats)
    - [GET /api/admin/blocklist](#get-apiadminblocklist)
    - [POST /api/admin/blocklist](#post-apiadminblocklist)
    - [POST /api/trades/complete](#post-apitradescomplete)
    - [GET /api/users/available](#get-apiusersavailable)
    - [GET /api/users/points](#get-apiuserspoints)
8. [Bilder anzeigen](#8-bilder-anzeigen)
9. [Welche Routen brauchen einen Token?](#9-welche-routen-brauchen-einen-token)
10. [Fehlerbehandlung](#10-fehlerbehandlung)
11. [Komplette Beispiele (Copy-Paste)](#11-komplette-beispiele-copy-paste)
12. [Architekturübersicht](#12-architekturübersicht)


1. [Was ist dieser Server?](#1-was-ist-dieser-server)
2. [Wie funktioniert die Kommunikation?](#2-wie-funktioniert-die-kommunikation)
3. [Authentifizierung (Login / Token)](#3-authentifizierung-login--token)
4. [Umgebungsvariablen (Environment Variables)](#4-umgebungsvariablen)
5. [Datenbankstruktur](#5-datenbankstruktur)
6. [Datentypen (TypeScript)](#6-datentypen-typescript)
7. [Alle API-Endpunkte im Detail](#7-alle-api-endpunkte-im-detail)
    - [POST /api/register](#post-apiregister)
    - [POST /api/login](#post-apilogin)
    - [GET /api/images](#get-apiimages)
    - [POST /api/upload](#post-apiupload)
    - [POST /api/delete](#post-apidelete)
    - [GET /api/messages](#get-apimessages)
    - [POST /api/messages](#post-apimessages)
    - [POST /api/feedback](#post-apifeedback)
    - [POST /api/heartbeat](#post-apiheartbeat)
    - [GET /api/admin/stats](#get-apiadminstats)
    - [POST /api/admin/stats](#post-apiadminstats)
    - [GET /api/admin/blocklist](#get-apiadminblocklist)
    - [POST /api/admin/blocklist](#post-apiadminblocklist)
    - [POST /api/trades/complete](#post-apitradescomplete)
    - [GET /api/users/available](#get-apiusersavailable)
    - [GET /api/users/points](#get-apiuserspoints)
8. [Bilder anzeigen](#8-bilder-anzeigen)
9. [Welche Routen brauchen einen Token?](#9-welche-routen-brauchen-einen-token)
10. [Fehlerbehandlung](#10-fehlerbehandlung)
11. [Komplette Beispiele (Copy-Paste)](#11-komplette-beispiele-copy-paste)
12. [Architekturübersicht](#12-architekturübersicht)

---

## 1. Was ist dieser Server?

Das ist ein **Nuxt 4** Fullstack-Projekt. Das bedeutet:
- Das Frontend (Vue-Komponenten, Seiten) und das Backend (API-Endpunkte) sind **im gleichen Projekt**.
- Der Server läuft auf **Nitro** (eingebaut in Nuxt).
- Die Datenbank ist **PostgreSQL**.
- Bilder werden in **MinIO** gespeichert (ein selbst gehosteter S3-kompatibler Speicher).
- Authentifizierung läuft über **JWT-Token** (JSON Web Token).

Du schreibst dein Frontend in Vue 3 und kannst alle APIs einfach mit `useFetch` oder `$fetch` aufrufen – du brauchst keine eigene Basis-URL anzugeben, weil alles auf dem gleichen Server läuft.

---

## 2. Wie funktioniert die Kommunikation?

### Grundprinzip

```
Dein Frontend (Vue-Komponente)
        ↓  schickt HTTP-Request
Server (Nuxt / Nitro)
        ↓  liest Datenbank oder MinIO
        ↓  gibt JSON zurück
Dein Frontend
        ↓  zeigt Daten an
```

### Wie du Requests machst (in Vue 3 / Nuxt)

**Option A – `useFetch` (reaktiv, empfohlen für Seiteninhalte)**
```typescript
const { data, error, pending } = await useFetch('/api/images')
// data.value enthält die Antwort
// error.value enthält den Fehler, falls etwas schief lief
// pending.value ist true, während geladen wird
```

**Option B – `$fetch` (einfach, gut für Button-Klicks / Formulare)**
```typescript
const result = await $fetch('/api/login', {
  method: 'POST',
  body: { login: 'test@kzu.ch', password: '1234' }
})
```

**Unterschied:** `useFetch` ist reaktiv und lädt beim Seitenaufruf automatisch. `$fetch` ist ein einmaliger Call, den du selbst auslöst.

---

## 3. Authentifizierung (Login / Token)

### Was ist ein JWT-Token?

Nach dem Login gibt der Server einen Token zurück – das ist ein langer verschlüsselter String, z.B.:
```
eyJhbGciOiJIUzI1NiJ9.eyJsb2dpbiI6InRlc3RAa3p1LmNoIiwicm9sZSI6InVzZXIifQ.abc123
```

Dieser Token ist dein „Ausweis". Du schickst ihn bei jedem gesicherten Request mit, damit der Server weiß, wer du bist.

### Wie Token speichern?

Speichere den Token im **localStorage** (einfachste Option) oder in einem **useState** / Pinia-Store:

```typescript
// Nach Login speichern
localStorage.setItem('auth_token', result.token)
localStorage.setItem('auth_role', result.role)
localStorage.setItem('auth_login', result.login)

// Token auslesen
const token = localStorage.getItem('auth_token')

// Ausloggen
localStorage.removeItem('auth_token')
```

### Wie Token mitsenden?

Bei **gesicherten Routen** musst du den Token im `Authorization`-Header mitschicken:

```typescript
const token = localStorage.getItem('auth_token')

await $fetch('/api/upload', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`  // "Bearer " + der Token
  },
  body: formData
})
```

> ⚠️ **Wichtig:** Das Prefix ist `Bearer ` (mit Leerzeichen). Ohne das funktioniert die Authentifizierung nicht.

### Rollen

Es gibt zwei Rollen:
| Rolle | Kann |
|-------|------|
| `user` | Posts erstellen, eigene Posts löschen, Nachrichten schreiben |
| `admin` | Alles – auch fremde Posts löschen, Admin-Stats sehen, Blocklist verwalten |

---

## 4. Umgebungsvariablen

Diese Variablen müssen in einer `.env`-Datei im Projektroot gesetzt werden, damit der Server funktioniert. Du musst diese **nicht** für dein Frontend setzen – nur der Server braucht sie.

```env
TOKEN_SECRET=ein-geheimer-schlüssel-123
DATABASE_URL=postgresql://user:password@localhost:5432/kzu_traade
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploads
```

---

## 5. Datenbankstruktur

Die Datenbank hat folgende Tabellen. Das wird dir helfen zu verstehen, welche Felder existieren:

### Tabelle: `users`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | TEXT | Eindeutige ID (UUID) |
| `email` | TEXT | E-Mail-Adresse (muss @kzu.ch sein) |
| `password_hash` | TEXT | SHA-256-Hash des Passworts |
| `role` | TEXT | `'user'` oder `'admin'` |

### Tabelle: `posts`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | TEXT | Eindeutige ID |
| `title` | TEXT | Titel des Angebots |
| `description` | TEXT | Beschreibung |
| `category` | TEXT | Kategorie (siehe erlaubte Werte unten) |
| `wishes` | TEXT | Was der Anbieter im Tausch möchte (optional) |
| `images` | TEXT[] | Array von Bild-Schlüsseln (z.B. `["1234_abc.jpg"]`) |
| `main_image` | TEXT | Der Hauptbild-Schlüssel |
| `owner_email` | TEXT | E-Mail des Erstellers |
| `owner_name` | TEXT | Anzeigename des Erstellers |
| `author` | TEXT | Alter Feldname (legacy) |
| `created_at` | TEXT | ISO-Datum-String |
| `updated_at` | BIGINT | Timestamp (optional) |

### Tabelle: `messages`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | TEXT | Eindeutige ID |
| `post_id` | TEXT | ID des zugehörigen Posts |
| `author` | TEXT | Anzeigename des Verfassers |
| `author_email` | TEXT | E-Mail des Verfassers |
| `content` | TEXT | Nachrichtentext |
| `created_at` | TEXT | ISO-Datum-String |

### Tabelle: `stats`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | INTEGER | Immer `1` (ein einziger Datensatz) |
| `total_views` | BIGINT | Gesamtanzahl Seitenaufrufe |

### Tabelle: `blocklist`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `word` | TEXT | Gesperrtes Wort |

---

## 6. Datentypen (TypeScript)

Diese Typen beschreiben, was der Server zurückgibt und erwartet:

```typescript
// Erlaubte Kategorien für Posts
type TradeCategory = 'Schulmaterial' | 'Stifte' | 'Bücher' | 'Sportmaterialien' | 'Anderes'

// Ein Post / Angebot
interface Post {
  id: string
  title: string
  description: string
  category: string
  images?: string[]       // Array der Bild-Keys
  mainImage?: string      // Key des Hauptbildes
  ownerEmail?: string     // E-Mail des Erstellers
  ownerName?: string      // Anzeigename des Erstellers
  author?: string         // Legacy-Feld
  wishes?: string         // Tauschwunsch (optional)
  createdAt: string | number
  updatedAt?: number
}

// Ein User
interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

// Eine Nachricht
interface Message {
  id: string
  postId: string
  author: string
  authorEmail: string
  content: string
  createdAt: string
}
```

---

## 7. Alle API-Endpunkte im Detail

---

### POST /api/register

**Was macht er?** Neuen Account erstellen.

**Braucht Token?** ❌ Nein

**Request Body (JSON):**
```json
{
  "email": "vorname.nachname@kzu.ch",
  "password": "meinPasswort"
}
```

**Validierungen:**
- E-Mail muss auf `@kzu.ch` oder `@*.kzu.ch` enden
- Passwort muss mindestens 4 Zeichen haben
- E-Mail darf noch nicht registriert sein

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "message": "Registrierung erfolgreich. Du kannst dich jetzt einloggen."
}
```

**Fehler:**
| Code | Bedeutung |
|------|-----------|
| 400 | E-Mail/Passwort fehlt, falsche Domain, zu kurzes Passwort, E-Mail bereits registriert |

**Beispiel:**
```typescript
try {
  const result = await $fetch('/api/register', {
    method: 'POST',
    body: {
      email: 'hans.muster@kzu.ch',
      password: 'sicher123'
    }
  })
  console.log(result.message) // "Registrierung erfolgreich..."
} catch (err: any) {
  console.error(err.data?.statusMessage) // z.B. "Nur E-Mail-Adressen mit kzu.ch sind erlaubt"
}
```

---

### POST /api/login

**Was macht er?** Einloggen und Token holen.

**Braucht Token?** ❌ Nein

**Request Body (JSON):**
```json
{
  "login": "vorname.nachname@kzu.ch",
  "password": "meinPasswort"
}
```

**Erfolgreiche Antwort (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "role": "user",
  "login": "vorname.nachname@kzu.ch"
}
```

> Der Token ist **7 Tage** gültig.

**Fehler:**
| Code | Bedeutung |
|------|-----------|
| 400 | Login oder Passwort fehlt |
| 401 | Falsche E-Mail oder falsches Passwort |

**Beispiel:**
```typescript
try {
  const result = await $fetch('/api/login', {
    method: 'POST',
    body: { login: 'hans.muster@kzu.ch', password: 'sicher123' }
  })

  // Token speichern
  localStorage.setItem('auth_token', result.token)
  localStorage.setItem('auth_role', result.role)
  localStorage.setItem('auth_login', result.login)

  // Weiterleiten
  navigateTo('/dashboard')
} catch (err: any) {
  alert(err.data?.statusMessage) // "Ungültige Anmeldedaten"
}
```

---

### GET /api/images

**Was macht er?** Alle Posts / Angebote laden.

> ⚠️ **Achtung:** Der Name ist irreführend – dieser Endpunkt gibt ALLE Posts zurück, nicht nur Bilder!

**Braucht Token?** ❌ Nein

**Query-Parameter:** Keine

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "posts": [
    {
      "id": "1234_abc",
      "title": "Mathe-Buch",
      "description": "Wenig benutzt",
      "category": "Bücher",
      "wishes": "Englisch-Buch",
      "images": ["1720000000_xyz.jpg", "1720000001_abc.png"],
      "mainImage": "1720000000_xyz.jpg",
      "ownerEmail": "hans.muster@kzu.ch",
      "ownerName": "Hans Muster",
      "createdAt": "2025-07-01T10:00:00.000Z"
    }
  ]
}
```

**Beispiel:**
```typescript
const { data } = await useFetch('/api/images')
const posts = data.value?.posts // Array aller Posts
```

---

### POST /api/upload

**Was macht er?** Neuen Post mit Bildern erstellen.

**Braucht Token?** ✅ Ja (`user` oder `admin`)

**Request-Format:** `multipart/form-data` (kein JSON!)

**Formular-Felder:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `title` | Text | ✅ | Titel des Angebots |
| `description` | Text | ✅ | Beschreibung |
| `category` | Text | ✅ | Einer von: `Schulmaterial`, `Stifte`, `Bücher`, `Sportmaterialien`, `Anderes` |
| `wishes` | Text | ❌ | Was du im Tausch möchtest |
| `mainImageIndex` | Text (Zahl) | ❌ | Index des Hauptbildes (Standard: `0`) |
| `rulesAccepted` | Text (`"true"`) | ✅ | Nutzer muss Regeln akzeptiert haben |
| `files` | Datei(en) | ✅ | 1–8 Bilder (JPEG, PNG, WebP, GIF, max. 100 MB pro Bild) |

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "post": {
    "id": "1720000000_xyz",
    "title": "Mathe-Buch",
    "description": "Wenig benutzt",
    "category": "Bücher",
    "images": ["1720000000_abc.jpg"],
    "mainImage": "1720000000_abc.jpg",
    "ownerEmail": "hans.muster@kzu.ch",
    "ownerName": "Hans Muster",
    "createdAt": "2025-07-01T10:00:00.000Z"
  }
}
```

**Fehler:**
| Code | Bedeutung |
|------|-----------|
| 400 | Pflichtfelder fehlen, falsche Kategorie, Regeln nicht akzeptiert, falsches Bildformat, zu viele/wenige Bilder |
| 401 | Nicht eingeloggt |

**Beispiel:**
```typescript
const token = localStorage.getItem('auth_token')

const formData = new FormData()
formData.append('title', 'Mathe-Buch')
formData.append('description', 'Wenig benutzt, guter Zustand')
formData.append('category', 'Bücher')
formData.append('wishes', 'Englisch-Buch')
formData.append('rulesAccepted', 'true')
formData.append('mainImageIndex', '0')

// Bilder hinzufügen (z.B. aus einem <input type="file" multiple>)
for (const file of selectedFiles) {
  formData.append('files', file)
}

try {
  const result = await $fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
    // WICHTIG: Content-Type NICHT manuell setzen – wird automatisch gesetzt!
  })
  console.log('Erstellt:', result.post)
} catch (err: any) {
  console.error(err.data?.statusMessage)
}
```

---

### POST /api/delete

**Was macht er?** Einen Post löschen (inklusive seiner Bilder im Speicher).

**Braucht Token?** ✅ Ja (`user` kann nur eigene Posts löschen, `admin` alle)

**Request Body (JSON):**
```json
{
  "id": "die-post-id"
}
```

**Erfolgreiche Antwort (200):**
```json
{
  "success": true
}
```

**Fehler:**
| Code | Bedeutung |
|------|-----------|
| 400 | Keine ID angegeben |
| 401 | Nicht eingeloggt |
| 403 | Du darfst diesen Post nicht löschen (nicht dein eigener) |
| 404 | Post existiert nicht |

**Beispiel:**
```typescript
const token = localStorage.getItem('auth_token')

try {
  await $fetch('/api/delete', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { id: '1720000000_xyz' }
  })
  alert('Post gelöscht!')
} catch (err: any) {
  alert(err.data?.statusMessage)
}
```

---

### GET /api/messages

**Was macht er?** Alle Nachrichten zu einem bestimmten Post laden.

**Braucht Token?** ❌ Nein

**Query-Parameter:**
| Parameter | Pflicht | Beschreibung |
|-----------|---------|-------------|
| `postId` | ✅ | Die ID des Posts |

**URL-Beispiel:** `/api/messages?postId=1720000000_xyz`

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "1720000000_abc123",
      "postId": "1720000000_xyz",
      "author": "Hans Muster",
      "authorEmail": "hans.muster@kzu.ch",
      "content": "Ist das Buch noch verfügbar?",
      "createdAt": "2025-07-01T10:05:00.000Z"
    }
  ]
}
```

**Fehler-Antwort (kein Statuscode-Fehler, sondern normales Objekt):**
```json
{
  "error": "Post ID erforderlich",
  "messages": []
}
```

**Beispiel:**
```typescript
const postId = '1720000000_xyz'
const { data } = await useFetch(`/api/messages?postId=${postId}`)
const messages = data.value?.messages // Array der Nachrichten
```

---

### POST /api/messages

**Was macht er?** Eine neue Nachricht zu einem Post schreiben.

**Braucht Token?** ✅ Ja (Token im `Authorization`-Header)

> ℹ️ **Hinweis:** Nachrichten werden automatisch gefiltert, wenn sie Wörter aus der Blocklist enthalten – der Inhalt wird dann durch `[GEBLOCKTER INHALT]` ersetzt.

**Request Body (JSON):**
```json
{
  "postId": "die-post-id",
  "content": "Ist das noch verfügbar?"
}
```

**Validierungen:**
- `content` darf nicht leer sein
- `content` darf maximal 2000 Zeichen lang sein

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "message": {
    "id": "1720000000_abc123",
    "postId": "1720000000_xyz",
    "author": "Hans Muster",
    "authorEmail": "hans.muster@kzu.ch",
    "content": "Ist das noch verfügbar?",
    "createdAt": "2025-07-01T10:05:00.000Z"
  }
}
```

**Fehler-Antwort (kein HTTP-Fehler, sondern normales Objekt mit `error`):**
```json
{ "error": "Authentifizierung erforderlich" }
{ "error": "Ungültiger oder abgelaufener Token" }
{ "error": "Nachricht darf maximal 2000 Zeichen lang sein" }
```

**Beispiel:**
```typescript
const token = localStorage.getItem('auth_token')

const result = await $fetch('/api/messages', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: {
    postId: '1720000000_xyz',
    content: 'Ist das noch verfügbar?'
  }
})

if (result.error) {
  alert(result.error)
} else {
  console.log('Neue Nachricht:', result.message)
}
```

---

### POST /api/feedback

**Was macht er?** Feedback-Formular einsenden (wird an Formspree weitergeleitet).

**Braucht Token?** ❌ Nein

**Rate Limit:** Maximal **5 Requests pro Stunde** pro IP-Adresse.

**Request Body (JSON):**
```json
{
  "email": "hans.muster@kzu.ch",
  "message": "Das ist mein Feedback...",
  "name": "Hans Muster",
  "category": "Bug"
}
```

**Pflichtfelder:** `email`, `message`  
**Optionale Felder:** `name`, `category`

**Erfolgreiche Antwort (200):**
```json
{ "success": true }
```

**Fehler:**
| Code | Bedeutung |
|------|-----------|
| 400 | E-Mail oder Nachricht fehlt |
| 429 | Zu viele Anfragen (Rate Limit erreicht) |
| 502 | Formspree-Dienst nicht erreichbar |

**Beispiel:**
```typescript
try {
  await $fetch('/api/feedback', {
    method: 'POST',
    body: {
      email: 'hans.muster@kzu.ch',
      message: 'Tolle App, aber ich habe einen Fehler gefunden...',
      name: 'Hans',
      category: 'Bug-Report'
    }
  })
  alert('Feedback gesendet!')
} catch (err: any) {
  if (err.status === 429) alert('Zu viele Anfragen. Bitte warte eine Stunde.')
  else alert(err.data?.statusMessage)
}
```

---

### POST /api/heartbeat

**Was macht er?** Teilt dem Server mit, dass ein User noch online ist. Gibt außerdem zurück, ob der User weitergeleitet werden soll (Admin-Feature).

**Braucht Token?** ❌ Nein (Token ist optional – wenn vorhanden, wird der User als eingeloggt getrackt)

**Request Body (JSON):**
```json
{
  "id": "eine-einzigartige-client-id"
}
```

> Die `id` muss eine einzigartige ID sein, die du für jeden Browser-Tab erzeugst, z.B. mit `crypto.randomUUID()`.

**Erfolgreiche Antwort (200):**
```json
{
  "redirect": null
}
```
Oder, wenn ein Admin eine Weiterleitung gesetzt hat:
```json
{
  "redirect": {
    "url": "/neue-seite",
    "timestamp": 1720000000000
  }
}
```

**Wie verwenden:**
```typescript
// Beim Seitenaufruf eine einmalige ID erzeugen
const clientId = localStorage.getItem('client_id') || crypto.randomUUID()
localStorage.setItem('client_id', clientId)

const token = localStorage.getItem('auth_token')

// Alle 10 Sekunden schicken
setInterval(async () => {
  const result = await $fetch('/api/heartbeat', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: { id: clientId }
  })

  if (result.redirect) {
    // Admin hat Weiterleitung gesetzt
    navigateTo(result.redirect.url)
  }
}, 10_000) // 10.000 ms = 10 Sekunden
```

---

### GET /api/admin/stats

**Was macht er?** Statistiken abrufen: Seitenaufrufe und Online-User.

**Braucht Token?** ✅ Ja – **nur Admin**

**Erfolgreiche Antwort (200):**
```json
{
  "totalViews": 1234,
  "onlineCount": 3,
  "users": [
    {
      "id": "abc-123",
      "ip": "123.45.67.89",
      "login": "hans.muster@kzu.ch",
      "lastSeen": 1720000000000
    }
  ]
}
```

> `users` enthält User, die in den letzten 15 Sekunden einen Heartbeat geschickt haben.

**Beispiel:**
```typescript
const token = localStorage.getItem('auth_token')

const stats = await $fetch('/api/admin/stats', {
  headers: { Authorization: `Bearer ${token}` }
})

console.log(`${stats.totalViews} Aufrufe, ${stats.onlineCount} online`)
```

---

### POST /api/admin/stats

**Was macht er?** Weiterleitung für alle (oder einen bestimmten) Online-User setzen.

**Braucht Token?** ✅ Ja – **nur Admin**

**Request Body (JSON):**
```json
{
  "url": "/neue-seite",
  "targetId": "abc-123"
}
```

> `targetId` ist optional. Ohne `targetId` werden ALLE online User weitergeleitet. Mit `targetId` nur ein bestimmter User.

**Erfolgreiche Antwort (200):**
```json
{ "success": true }
```

**Beispiel:**
```typescript
const token = localStorage.getItem('auth_token')

// Alle zu /wartung weiterleiten
await $fetch('/api/admin/stats', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: { url: '/wartung' }
})

// Nur einen bestimmten User weiterleiten
await $fetch('/api/admin/stats', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: { url: '/ban', targetId: 'abc-123' }
})
```

---

### GET /api/admin/blocklist

**Was macht er?** Alle gesperrten Wörter abrufen.

**Braucht Token?** ✅ Ja – **nur Admin**

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "words": ["schimpfwort1", "schimpfwort2"]
}
```

**Beispiel:**
```typescript
const token = localStorage.getItem('auth_token')
const { data } = await useFetch('/api/admin/blocklist', {
  headers: { Authorization: `Bearer ${token}` }
})
const words = data.value?.words
```

---

### POST /api/admin/blocklist

**Was macht er?** Die gesamte Blocklist ersetzen (atomisch – entweder alles oder nichts).

**Braucht Token?** ✅ Ja – **nur Admin**

**Request Body (JSON):**
```json
{
  "words": ["wort1", "wort2", "wort3"]
}
```

> Schicke ein leeres Array `[]`, um alle gesperrten Wörter zu löschen.

**Erfolgreiche Antwort (200):**
```json
{ "success": true }
```

**Fehler:**
| Code | Bedeutung |
|------|-----------|
| 400 | `words` ist kein Array |

**Beispiel:**
```typescript
const token = localStorage.getItem('auth_token')

await $fetch('/api/admin/blocklist', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: { words: ['böseswort', 'nocheinbösenwort'] }
})
```

---

### POST /api/trades/complete

**Was macht er?** Einen Tausch als abgeschlossen markieren.

> ⚠️ **Hinweis:** Dieser Endpunkt ist noch **nicht vollständig implementiert** (Stub). Die Datenbanklogik fehlt noch. Er gibt immer 50 Punkte zurück.

**Braucht Token?** ❌ (Derzeit nicht – die Auth-Logik ist ein Placeholder)

**Request Body (JSON):**
```json
{
  "itemTitle": "Mathe-Buch",
  "itemDescription": "Hardcover, Ausgabe 2023",
  "partnerLogin": "max.mueller@kzu.ch",
  "partnerId": "user-partner-id"
}
```

**Pflichtfelder:** `itemTitle`, `partnerLogin`, `partnerId`

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "message": "Handel erfolgreich abgeschlossen! Beide Spieler erhalten 50 Punkte.",
  "pointsAwarded": 50
}
```

---

### GET /api/users/available

**Was macht er?** Liste aller verfügbaren User zum Handeln abrufen.

> ⚠️ **Hinweis:** Noch **nicht implementiert** (Stub). Gibt immer ein leeres Array zurück.

**Braucht Token?** ❌ (Derzeit nicht – Placeholder)

**Erfolgreiche Antwort (200):**
```json
{
  "users": []
}
```

---

### GET /api/users/points

**Was macht er?** Punkte des aktuellen Users abrufen.

> ⚠️ **Hinweis:** Noch **nicht implementiert** (Stub). Gibt immer `0` zurück.

**Braucht Token?** ❌ (Derzeit nicht – Placeholder)

**Erfolgreiche Antwort (200):**
```json
{
  "points": 0
}
```

---

## 8. Bilder anzeigen

Bilder werden in MinIO gespeichert und über einen Proxy-Pfad `/uploads/` ausgeliefert.

In der Datenbank stehen nur die **Schlüssel** (Keys), z.B. `1720000000_xyz.jpg`.

Um ein Bild anzuzeigen, hänge den Key an den Pfad `/uploads/`:

```
/uploads/1720000000_xyz.jpg
```

**In Vue:**
```html
<img :src="`/uploads/${post.mainImage}`" :alt="post.title" />
```

**Mit dem Nuxt Image-Modul (empfohlen für Performance):**
```html
<NuxtImg :src="`/uploads/${post.mainImage}`" :alt="post.title" />
```

---

## 9. Welche Routen brauchen einen Token?

| Route | Methode | Benötigte Rolle |
|-------|---------|----------------|
| `/api/upload` | POST | `user` oder `admin` |
| `/api/delete` | POST | `user` (nur eigene Posts) oder `admin` |
| `/api/create-post` | POST | `user` oder `admin` |
| `/api/messages` | POST | `user` oder `admin` |
| `/api/admin/*` | GET/POST | **nur `admin`** |

Alle anderen Routen sind öffentlich zugänglich (kein Token nötig).

---

## 10. Fehlerbehandlung

Alle HTTP-Fehler haben dieses Format:
```json
{
  "statusCode": 401,
  "statusMessage": "Nicht eingeloggt"
}
```

Bei `$fetch` wird bei einem HTTP-Fehler automatisch eine Exception geworfen. Du fängst sie mit `try/catch`:

```typescript
try {
  const result = await $fetch('/api/upload', { ... })
} catch (err: any) {
  // err.status      → HTTP-Statuscode (z.B. 401, 400, 403)
  // err.data        → Das Fehlerobjekt vom Server
  // err.data.statusMessage → Die Fehlermeldung auf Deutsch

  if (err.status === 401) {
    // Nicht eingeloggt → zum Login weiterleiten
    navigateTo('/login')
  } else {
    alert(err.data?.statusMessage || 'Unbekannter Fehler')
  }
}
```

**Wichtig für `/api/messages` (POST und GET):** Diese Endpunkte werfen **keine** HTTP-Fehler, sondern geben ein Objekt mit `error`-Feld zurück:
```typescript
const result = await $fetch('/api/messages', { ... })
if (result.error) {
  // Fehler behandeln
  console.error(result.error)
}
```

---

## 11. Komplette Beispiele (Copy-Paste)

### Composable: `useAuth` (wiederverwendbare Auth-Logik)

Erstelle `app/composables/useAuth.ts`:

```typescript
export function useAuth() {
  const token = computed(() => localStorage.getItem('auth_token'))
  const role = computed(() => localStorage.getItem('auth_role'))
  const login = computed(() => localStorage.getItem('auth_login'))
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'admin')

  const authHeaders = computed(() => ({
    Authorization: token.value ? `Bearer ${token.value}` : ''
  }))

  function logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_role')
    localStorage.removeItem('auth_login')
    navigateTo('/login')
  }

  return { token, role, login, isLoggedIn, isAdmin, authHeaders, logout }
}
```

### Seite: Login

```vue
<script setup lang="ts">
const form = reactive({ login: '', password: '' })
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const result = await $fetch('/api/login', {
      method: 'POST',
      body: form
    })
    localStorage.setItem('auth_token', result.token)
    localStorage.setItem('auth_role', result.role)
    localStorage.setItem('auth_login', result.login)
    navigateTo('/')
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Fehler beim Login'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="form.login" type="email" placeholder="E-Mail" required />
    <input v-model="form.password" type="password" placeholder="Passwort" required />
    <p v-if="error" style="color: red">{{ error }}</p>
    <button type="submit" :disabled="loading">
      {{ loading ? 'Lade...' : 'Einloggen' }}
    </button>
  </form>
</template>
```

### Seite: Alle Posts laden und anzeigen

```vue
<script setup lang="ts">
const { data, pending, error } = await useFetch('/api/images')
const posts = computed(() => data.value?.posts ?? [])
</script>

<template>
  <div v-if="pending">Lädt...</div>
  <div v-else-if="error">Fehler beim Laden</div>
  <div v-else>
    <div v-for="post in posts" :key="post.id">
      <img :src="`/uploads/${post.mainImage}`" :alt="post.title" />
      <h2>{{ post.title }}</h2>
      <p>{{ post.description }}</p>
      <span>{{ post.category }}</span>
      <span v-if="post.wishes">Tauschwunsch: {{ post.wishes }}</span>
      <small>von {{ post.ownerName }}</small>
    </div>
  </div>
</template>
```

### Post hochladen

```vue
<script setup lang="ts">
const { authHeaders, isLoggedIn } = useAuth()

const title = ref('')
const description = ref('')
const category = ref('Bücher')
const wishes = ref('')
const files = ref<FileList | null>(null)
const rulesAccepted = ref(false)
const loading = ref(false)
const error = ref('')

async function handleUpload() {
  if (!isLoggedIn.value) return navigateTo('/login')

  error.value = ''
  loading.value = true

  const formData = new FormData()
  formData.append('title', title.value)
  formData.append('description', description.value)
  formData.append('category', category.value)
  formData.append('wishes', wishes.value)
  formData.append('rulesAccepted', rulesAccepted.value ? 'true' : 'false')
  formData.append('mainImageIndex', '0')

  if (files.value) {
    for (const file of files.value) {
      formData.append('files', file)
    }
  }

  try {
    await $fetch('/api/upload', {
      method: 'POST',
      headers: authHeaders.value,
      body: formData
    })
    navigateTo('/')
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Fehler beim Hochladen'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleUpload">
    <input v-model="title" placeholder="Titel" required />
    <textarea v-model="description" placeholder="Beschreibung" required />
    <select v-model="category">
      <option>Schulmaterial</option>
      <option>Stifte</option>
      <option>Bücher</option>
      <option>Sportmaterialien</option>
      <option>Anderes</option>
    </select>
    <input v-model="wishes" placeholder="Was möchtest du im Tausch?" />
    <input type="file" multiple accept="image/*" @change="e => files = (e.target as HTMLInputElement).files" />
    <label>
      <input v-model="rulesAccepted" type="checkbox" />
      Ich akzeptiere die Regeln
    </label>
    <p v-if="error" style="color: red">{{ error }}</p>
    <button type="submit" :disabled="loading">
      {{ loading ? 'Wird hochgeladen...' : 'Angebot erstellen' }}
    </button>
  </form>
</template>
```

---

## 12. Architekturübersicht

```
┌──────────────────────────────────────────────────────┐
│                  Dein Frontend (Vue 3)                │
│  app/pages/  app/components/  app/composables/        │
└─────────────────────┬────────────────────────────────┘
                      │ HTTP Requests (useFetch / $fetch)
┌─────────────────────▼────────────────────────────────┐
│              Nuxt Server (Nitro)                       │
│                                                        │
│  Middleware:                                           │
│  ├── auth.ts     → prüft JWT-Token                    │
│  └── views.ts    → zählt Seitenaufrufe                │
│                                                        │
│  API-Endpunkte (server/api/):                         │
│  ├── POST /api/register                               │
│  ├── POST /api/login                                  │
│  ├── GET  /api/images      (alle Posts)               │
│  ├── POST /api/upload      (Post erstellen + Bilder)  │
│  ├── POST /api/delete      (Post löschen)             │
│  ├── GET  /api/messages    (Nachrichten laden)        │
│  ├── POST /api/messages    (Nachricht schreiben)      │
│  ├── POST /api/feedback    (Feedback senden)          │
│  ├── POST /api/heartbeat   (Online-Status)            │
│  ├── GET  /api/admin/stats                            │
│  ├── POST /api/admin/stats                            │
│  ├── GET  /api/admin/blocklist                        │
│  └── POST /api/admin/blocklist                        │
│                                                        │
│  Utils:                                               │
│  ├── db.ts           → PostgreSQL-Verbindung          │
│  ├── s3.ts           → MinIO-Verbindung               │
│  └── online-tracker  → In-Memory Online-User          │
└────────┬────────────────────┬───────────────────────┘
         │                    │
┌────────▼──────┐    ┌────────▼──────────┐
│  PostgreSQL   │    │  MinIO (S3)        │
│               │    │                    │
│  - users      │    │  Bucket: uploads   │
│  - posts      │    │  (Bilder-Dateien)  │
│  - messages   │    └────────────────────┘
│  - stats      │
│  - blocklist  │
└───────────────┘
```

---

## Zusammenfassung: Die wichtigsten Punkte

1. **Alle API-Calls** gehen an `/api/...` – keine externe URL nötig
2. **Token** nach Login speichern, bei gesicherten Routen als `Authorization: Bearer TOKEN` Header mitschicken
3. **Bilder** werden unter `/uploads/KEY` angezeigt (Key kommt aus der Post-Antwort)
4. **Kategorien** sind fest: `Schulmaterial`, `Stifte`, `Bücher`, `Sportmaterialien`, `Anderes`
5. **Upload** verwendet `FormData` (kein JSON), `Content-Type` wird automatisch gesetzt
6. **Fehler** bei `$fetch` kommen als Exception – immer `try/catch` verwenden
7. **Nachrichten-POST** gibt keinen HTTP-Fehler, sondern ein `{ error: "..." }` Objekt zurück
8. **Heartbeat** alle 10 Sekunden senden, um Online-Status zu halten
