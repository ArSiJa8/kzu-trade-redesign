<template>
  <main v-pre class="documentation-page">
    <h1>KZU-TRAADE – Vollständige Backend-Dokumentation für das neue Frontend</h1>

    <blockquote>
      <p>
        <strong>Für Beginner geschrieben.</strong>
        Du findest hier alles, was du brauchst, um ein neues Frontend zu bauen, das mit diesem Server kommuniziert. Kein Vorwissen nötig.
      </p>
    </blockquote>

    <hr>

    <h2>Inhaltsverzeichnis</h2>

    <ol>
      <li><p><a href="#1-was-ist-dieser-server">Was ist dieser Server?</a></p></li>
      <li><p><a href="#2-wie-funktioniert-die-kommunikation">Wie funktioniert die Kommunikation?</a></p></li>
      <li><p><a href="#3-authentifizierung-login--token">Authentifizierung (Login / Token)</a></p></li>
      <li><p><a href="#4-umgebungsvariablen">Umgebungsvariablen (Environment Variables)</a></p></li>
      <li><p><a href="#5-datenbankstruktur">Datenbankstruktur</a></p></li>
      <li><p><a href="#6-datentypen-typescript">Datentypen (TypeScript)</a></p></li>
      <li>
        <p><a href="#7-alle-api-endpunkte-im-detail">Alle API-Endpunkte im Detail</a></p>
        <ul>
          <li><a href="#post-apiregister">POST /api/register</a></li>
          <li><a href="#post-apilogin">POST /api/login</a></li>
          <li><a href="#get-apiimages">GET /api/images</a></li>
          <li><a href="#post-apiupload">POST /api/upload</a></li>
          <li><a href="#post-apidelete">POST /api/delete</a></li>
          <li><a href="#get-apimessages">GET /api/messages</a></li>
          <li><a href="#post-apimessages">POST /api/messages</a></li>
          <li><a href="#post-apifeedback">POST /api/feedback</a></li>
          <li><a href="#post-apiheartbeat">POST /api/heartbeat</a></li>
          <li><a href="#get-apiadminstats">GET /api/admin/stats</a></li>
          <li><a href="#post-apiadminstats">POST /api/admin/stats</a></li>
          <li><a href="#get-apiadminblocklist">GET /api/admin/blocklist</a></li>
          <li><a href="#post-apiadminblocklist">POST /api/admin/blocklist</a></li>
          <li><a href="#post-apitradescomplete">POST /api/trades/complete</a></li>
          <li><a href="#get-apiusersavailable">GET /api/users/available</a></li>
          <li><a href="#get-apiuserspoints">GET /api/users/points</a></li>
        </ul>
      </li>
      <li><p><a href="#8-bilder-anzeigen">Bilder anzeigen</a></p></li>
      <li><p><a href="#9-welche-routen-brauchen-einen-token">Welche Routen brauchen einen Token?</a></p></li>
      <li><p><a href="#10-fehlerbehandlung">Fehlerbehandlung</a></p></li>
      <li><p><a href="#11-komplette-beispiele-copy-paste">Komplette Beispiele (Copy-Paste)</a></p></li>
      <li><p><a href="#12-architektur%C3%BCbersicht">Architekturübersicht</a></p></li>
    </ol>

    <hr>

    <h2 id="1-was-ist-dieser-server">1. Was ist dieser Server?</h2>

    <p>Das ist ein <strong>Nuxt 4</strong> Fullstack-Projekt. Das bedeutet:</p>

    <ul>
      <li>Das Frontend (Vue-Komponenten, Seiten) und das Backend (API-Endpunkte) sind <strong>im gleichen Projekt</strong>.</li>
      <li>Der Server läuft auf <strong>Nitro</strong> (eingebaut in Nuxt).</li>
      <li>Die Datenbank ist <strong>PostgreSQL</strong>.</li>
      <li>Bilder werden in <strong>MinIO</strong> gespeichert (ein selbst gehosteter S3-kompatibler Speicher).</li>
      <li>Authentifizierung läuft über <strong>JWT-Token</strong> (JSON Web Token).</li>
    </ul>

    <p>
      Du schreibst dein Frontend in Vue 3 und kannst alle APIs einfach mit
      <code>useFetch</code> oder <code>$fetch</code> aufrufen – du brauchst keine eigene Basis-URL anzugeben,
      weil alles auf dem gleichen Server läuft.
    </p>

    <hr>

    <h2 id="2-wie-funktioniert-die-kommunikation">2. Wie funktioniert die Kommunikation?</h2>

    <h3>Grundprinzip</h3>

    <pre><code>Dein Frontend (Vue-Komponente)
        ↓  schickt HTTP-Request
Server (Nuxt / Nitro)
        ↓  liest Datenbank oder MinIO
        ↓  gibt JSON zurück
Dein Frontend
        ↓  zeigt Daten an</code></pre>

    <h3>Wie du Requests machst (in Vue 3 / Nuxt)</h3>

    <p><strong>Option A – <code>useFetch</code> (reaktiv, empfohlen für Seiteninhalte)</strong></p>

    <pre><code class="language-typescript">const { data, error, pending } = await useFetch('/api/images')
// data.value enthält die Antwort
// error.value enthält den Fehler, falls etwas schief lief
// pending.value ist true, während geladen wird</code></pre>

    <p><strong>Option B – <code>$fetch</code> (einfach, gut für Button-Klicks / Formulare)</strong></p>

    <pre><code class="language-typescript">const result = await $fetch('/api/login', {
  method: 'POST',
  body: { login: 'test@kzu.ch', password: '1234' }
})</code></pre>

    <p>
      <strong>Unterschied:</strong>
      <code>useFetch</code> ist reaktiv und lädt beim Seitenaufruf automatisch.
      <code>$fetch</code> ist ein einmaliger Call, den du selbst auslöst.
    </p>

    <hr>

    <h2 id="3-authentifizierung-login--token">3. Authentifizierung (Login / Token)</h2>

    <h3>Was ist ein JWT-Token?</h3>

    <p>Nach dem Login gibt der Server einen Token zurück – das ist ein langer verschlüsselter String, z.B.:</p>

    <pre><code>eyJhbGciOiJIUzI1NiJ9.eyJsb2dpbiI6InRlc3RAa3p1LmNoIiwicm9sZSI6InVzZXIifQ.abc123</code></pre>

    <p>
      Dieser Token ist dein „Ausweis". Du schickst ihn bei jedem gesicherten Request mit,
      damit der Server weiß, wer du bist.
    </p>

    <h3>Wie Token speichern?</h3>

    <p>
      Speichere den Token im <strong>localStorage</strong> oder in einem <strong>useState</strong> / Pinia-Store:
    </p>

    <pre><code class="language-typescript">// Nach Login speichern
localStorage.setItem('auth_token', result.token)
localStorage.setItem('auth_role', result.role)
localStorage.setItem('auth_login', result.login)

// Token auslesen
const token = localStorage.getItem('auth_token')

// Ausloggen
localStorage.removeItem('auth_token')</code></pre>

    <h3>Wie Token mitsenden?</h3>

    <p>
      Bei <strong>gesicherten Routen</strong> musst du den Token im
      <code>Authorization</code>-Header mitschicken:
    </p>

    <pre><code class="language-typescript">const token = localStorage.getItem('auth_token')

await $fetch('/api/upload', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`  // "Bearer " + der Token
  },
  body: formData
})</code></pre>

    <blockquote>
      <p>
        ⚠️ <strong>Wichtig:</strong>
        Das Prefix ist <code>Bearer </code> mit Leerzeichen. Ohne das funktioniert die Authentifizierung nicht.
      </p>
    </blockquote>

    <h3>Rollen</h3>

    <p>Es gibt zwei Rollen:</p>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Rolle</th>
          <th>Kann</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td><code>user</code></td>
          <td>Posts erstellen, eigene Posts löschen, Nachrichten schreiben</td>
        </tr>
        <tr>
          <td><code>admin</code></td>
          <td>Alles – auch fremde Posts löschen, Admin-Stats sehen, Blocklist verwalten</td>
        </tr>
        </tbody>
      </table>
    </div>

    <hr>

    <h2 id="4-umgebungsvariablen">4. Umgebungsvariablen</h2>

    <p>
      Diese Variablen müssen in einer <code>.env</code>-Datei im Projektroot gesetzt werden,
      damit der Server funktioniert. Du musst diese <strong>nicht</strong> für dein Frontend setzen –
      nur der Server braucht sie.
    </p>

    <pre><code class="language-env">TOKEN_SECRET=ein-geheimer-schlüssel-123
DATABASE_URL=postgresql://user:password@localhost:5432/kzu_traade
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploads</code></pre>

    <hr>

    <h2 id="5-datenbankstruktur">5. Datenbankstruktur</h2>

    <p>Die Datenbank hat folgende Tabellen. Das wird dir helfen zu verstehen, welche Felder existieren:</p>

    <h3>Tabelle: <code>users</code></h3>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Spalte</th>
          <th>Typ</th>
          <th>Beschreibung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td><code>id</code></td><td>TEXT</td><td>Eindeutige ID (UUID)</td></tr>
        <tr><td><code>email</code></td><td>TEXT</td><td>E-Mail-Adresse (muss @kzu.ch sein)</td></tr>
        <tr><td><code>password_hash</code></td><td>TEXT</td><td>SHA-256-Hash des Passworts</td></tr>
        <tr><td><code>role</code></td><td>TEXT</td><td><code>'user'</code> oder <code>'admin'</code></td></tr>
        </tbody>
      </table>
    </div>

    <h3>Tabelle: <code>posts</code></h3>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Spalte</th>
          <th>Typ</th>
          <th>Beschreibung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td><code>id</code></td><td>TEXT</td><td>Eindeutige ID</td></tr>
        <tr><td><code>title</code></td><td>TEXT</td><td>Titel des Angebots</td></tr>
        <tr><td><code>description</code></td><td>TEXT</td><td>Beschreibung</td></tr>
        <tr><td><code>category</code></td><td>TEXT</td><td>Kategorie</td></tr>
        <tr><td><code>wishes</code></td><td>TEXT</td><td>Was der Anbieter im Tausch möchte (optional)</td></tr>
        <tr><td><code>images</code></td><td>TEXT[]</td><td>Array von Bild-Schlüsseln</td></tr>
        <tr><td><code>main_image</code></td><td>TEXT</td><td>Der Hauptbild-Schlüssel</td></tr>
        <tr><td><code>owner_email</code></td><td>TEXT</td><td>E-Mail des Erstellers</td></tr>
        <tr><td><code>owner_name</code></td><td>TEXT</td><td>Anzeigename des Erstellers</td></tr>
        <tr><td><code>author</code></td><td>TEXT</td><td>Alter Feldname (legacy)</td></tr>
        <tr><td><code>created_at</code></td><td>TEXT</td><td>ISO-Datum-String</td></tr>
        <tr><td><code>updated_at</code></td><td>BIGINT</td><td>Timestamp (optional)</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Tabelle: <code>messages</code></h3>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Spalte</th>
          <th>Typ</th>
          <th>Beschreibung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td><code>id</code></td><td>TEXT</td><td>Eindeutige ID</td></tr>
        <tr><td><code>post_id</code></td><td>TEXT</td><td>ID des zugehörigen Posts</td></tr>
        <tr><td><code>author</code></td><td>TEXT</td><td>Anzeigename des Verfassers</td></tr>
        <tr><td><code>author_email</code></td><td>TEXT</td><td>E-Mail des Verfassers</td></tr>
        <tr><td><code>content</code></td><td>TEXT</td><td>Nachrichtentext</td></tr>
        <tr><td><code>created_at</code></td><td>TEXT</td><td>ISO-Datum-String</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Tabelle: <code>stats</code></h3>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Spalte</th>
          <th>Typ</th>
          <th>Beschreibung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td><code>id</code></td><td>INTEGER</td><td>Immer <code>1</code></td></tr>
        <tr><td><code>total_views</code></td><td>BIGINT</td><td>Gesamtanzahl Seitenaufrufe</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Tabelle: <code>blocklist</code></h3>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Spalte</th>
          <th>Typ</th>
          <th>Beschreibung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td><code>word</code></td><td>TEXT</td><td>Gesperrtes Wort</td></tr>
        </tbody>
      </table>
    </div>

    <hr>

    <h2 id="6-datentypen-typescript">6. Datentypen (TypeScript)</h2>

    <p>Diese Typen beschreiben, was der Server zurückgibt und erwartet:</p>

    <pre><code class="language-typescript">type TradeCategory = 'Schulmaterial' | 'Stifte' | 'Bücher' | 'Sportmaterialien' | 'Anderes'

interface Post {
  id: string
  title: string
  description: string
  category: string
  images?: string[]
  mainImage?: string
  ownerEmail?: string
  ownerName?: string
  author?: string
  wishes?: string
  createdAt: string | number
  updatedAt?: number
}

interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

interface Message {
  id: string
  postId: string
  author: string
  authorEmail: string
  content: string
  createdAt: string
}</code></pre>

    <hr>

    <h2 id="7-alle-api-endpunkte-im-detail">7. Alle API-Endpunkte im Detail</h2>

    <hr>

    <h3 id="post-apiregister">POST /api/register</h3>

    <p><strong>Was macht er?</strong> Neuen Account erstellen.</p>
    <p><strong>Braucht Token?</strong> ❌ Nein</p>

    <p><strong>Request Body (JSON):</strong></p>

    <pre><code class="language-json">{
  "email": "vorname.nachname@kzu.ch",
  "password": "meinPasswort"
}</code></pre>

    <p><strong>Validierungen:</strong></p>

    <ul>
      <li>E-Mail muss auf <code>@kzu.ch</code> oder <code>@*.kzu.ch</code> enden</li>
      <li>Passwort muss mindestens 4 Zeichen haben</li>
      <li>E-Mail darf noch nicht registriert sein</li>
    </ul>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
  "success": true,
  "message": "Registrierung erfolgreich. Du kannst dich jetzt einloggen."
}</code></pre>

    <p><strong>Fehler:</strong></p>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Code</th>
          <th>Bedeutung</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>400</td>
          <td>E-Mail/Passwort fehlt, falsche Domain, zu kurzes Passwort, E-Mail bereits registriert</td>
        </tr>
        </tbody>
      </table>
    </div>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">try {
  const result = await $fetch('/api/register', {
    method: 'POST',
    body: {
      email: 'hans.muster@kzu.ch',
      password: 'sicher123'
    }
  })
  console.log(result.message)
} catch (err: any) {
  console.error(err.data?.statusMessage)
}</code></pre>

    <hr>

    <h3 id="post-apilogin">POST /api/login</h3>

    <p><strong>Was macht er?</strong> Einloggen und Token holen.</p>
    <p><strong>Braucht Token?</strong> ❌ Nein</p>

    <p><strong>Request Body (JSON):</strong></p>

    <pre><code class="language-json">{
  "login": "vorname.nachname@kzu.ch",
  "password": "meinPasswort"
}</code></pre>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "role": "user",
  "login": "vorname.nachname@kzu.ch"
}</code></pre>

    <blockquote>
      <p>Der Token ist <strong>7 Tage</strong> gültig.</p>
    </blockquote>

    <p><strong>Fehler:</strong></p>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Code</th>
          <th>Bedeutung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td>400</td><td>Login oder Passwort fehlt</td></tr>
        <tr><td>401</td><td>Falsche E-Mail oder falsches Passwort</td></tr>
        </tbody>
      </table>
    </div>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">try {
  const result = await $fetch('/api/login', {
    method: 'POST',
    body: { login: 'hans.muster@kzu.ch', password: 'sicher123' }
  })

  localStorage.setItem('auth_token', result.token)
  localStorage.setItem('auth_role', result.role)
  localStorage.setItem('auth_login', result.login)

  navigateTo('/dashboard')
} catch (err: any) {
  alert(err.data?.statusMessage)
}</code></pre>

    <hr>

    <h3 id="get-apiimages">GET /api/images</h3>

    <p><strong>Was macht er?</strong> Alle Posts / Angebote laden.</p>

    <blockquote>
      <p>
        ⚠️ <strong>Achtung:</strong>
        Der Name ist irreführend – dieser Endpunkt gibt ALLE Posts zurück, nicht nur Bilder!
      </p>
    </blockquote>

    <p><strong>Braucht Token?</strong> ❌ Nein</p>
    <p><strong>Query-Parameter:</strong> Keine</p>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
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
}</code></pre>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">const { data } = await useFetch('/api/images')
const posts = data.value?.posts</code></pre>

    <hr>

    <h3 id="post-apiupload">POST /api/upload</h3>

    <p><strong>Was macht er?</strong> Neuen Post mit Bildern erstellen.</p>
    <p><strong>Braucht Token?</strong> ✅ Ja (<code>user</code> oder <code>admin</code>)</p>
    <p><strong>Request-Format:</strong> <code>multipart/form-data</code> (kein JSON!)</p>

    <p><strong>Formular-Felder:</strong></p>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Feld</th>
          <th>Typ</th>
          <th>Pflicht</th>
          <th>Beschreibung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td><code>title</code></td><td>Text</td><td>✅</td><td>Titel des Angebots</td></tr>
        <tr><td><code>description</code></td><td>Text</td><td>✅</td><td>Beschreibung</td></tr>
        <tr><td><code>category</code></td><td>Text</td><td>✅</td><td>Einer von: <code>Schulmaterial</code>, <code>Stifte</code>, <code>Bücher</code>, <code>Sportmaterialien</code>, <code>Anderes</code></td></tr>
        <tr><td><code>wishes</code></td><td>Text</td><td>❌</td><td>Was du im Tausch möchtest</td></tr>
        <tr><td><code>mainImageIndex</code></td><td>Text (Zahl)</td><td>❌</td><td>Index des Hauptbildes</td></tr>
        <tr><td><code>rulesAccepted</code></td><td>Text (<code>"true"</code>)</td><td>✅</td><td>Nutzer muss Regeln akzeptiert haben</td></tr>
        <tr><td><code>files</code></td><td>Datei(en)</td><td>✅</td><td>1–8 Bilder</td></tr>
        </tbody>
      </table>
    </div>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
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
}</code></pre>

    <p><strong>Fehler:</strong></p>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Code</th>
          <th>Bedeutung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td>400</td><td>Pflichtfelder fehlen, falsche Kategorie, Regeln nicht akzeptiert, falsches Bildformat, zu viele/wenige Bilder</td></tr>
        <tr><td>401</td><td>Nicht eingeloggt</td></tr>
        </tbody>
      </table>
    </div>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">const token = localStorage.getItem('auth_token')

const formData = new FormData()
formData.append('title', 'Mathe-Buch')
formData.append('description', 'Wenig benutzt, guter Zustand')
formData.append('category', 'Bücher')
formData.append('wishes', 'Englisch-Buch')
formData.append('rulesAccepted', 'true')
formData.append('mainImageIndex', '0')

for (const file of selectedFiles) {
  formData.append('files', file)
}

try {
  const result = await $fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  })
  console.log('Erstellt:', result.post)
} catch (err: any) {
  console.error(err.data?.statusMessage)
}</code></pre>

    <hr>

    <h3 id="post-apidelete">POST /api/delete</h3>

    <p><strong>Was macht er?</strong> Einen Post löschen (inklusive seiner Bilder im Speicher).</p>
    <p><strong>Braucht Token?</strong> ✅ Ja (<code>user</code> kann nur eigene Posts löschen, <code>admin</code> alle)</p>

    <p><strong>Request Body (JSON):</strong></p>

    <pre><code class="language-json">{
  "id": "die-post-id"
}</code></pre>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
  "success": true
}</code></pre>

    <p><strong>Fehler:</strong></p>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Code</th>
          <th>Bedeutung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td>400</td><td>Keine ID angegeben</td></tr>
        <tr><td>401</td><td>Nicht eingeloggt</td></tr>
        <tr><td>403</td><td>Du darfst diesen Post nicht löschen</td></tr>
        <tr><td>404</td><td>Post existiert nicht</td></tr>
        </tbody>
      </table>
    </div>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">const token = localStorage.getItem('auth_token')

try {
  await $fetch('/api/delete', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { id: '1720000000_xyz' }
  })
  alert('Post gelöscht!')
} catch (err: any) {
  alert(err.data?.statusMessage)
}</code></pre>

    <hr>

    <h3 id="get-apimessages">GET /api/messages</h3>

    <p><strong>Was macht er?</strong> Alle Nachrichten zu einem bestimmten Post laden.</p>
    <p><strong>Braucht Token?</strong> ❌ Nein</p>

    <p><strong>Query-Parameter:</strong></p>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Parameter</th>
          <th>Pflicht</th>
          <th>Beschreibung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td><code>postId</code></td><td>✅</td><td>Die ID des Posts</td></tr>
        </tbody>
      </table>
    </div>

    <p><strong>URL-Beispiel:</strong> <code>/api/messages?postId=1720000000_xyz</code></p>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
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
}</code></pre>

    <p><strong>Fehler-Antwort:</strong></p>

    <pre><code class="language-json">{
  "error": "Post ID erforderlich",
  "messages": []
}</code></pre>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">const postId = '1720000000_xyz'
const { data } = await useFetch(`/api/messages?postId=${postId}`)
const messages = data.value?.messages</code></pre>

    <hr>

    <h3 id="post-apimessages">POST /api/messages</h3>

    <p><strong>Was macht er?</strong> Eine neue Nachricht zu einem Post schreiben.</p>
    <p><strong>Braucht Token?</strong> ✅ Ja</p>

    <blockquote>
      <p>
        ℹ️ <strong>Hinweis:</strong>
        Nachrichten werden automatisch gefiltert, wenn sie Wörter aus der Blocklist enthalten –
        der Inhalt wird dann durch <code>[GEBLOCKTER INHALT]</code> ersetzt.
      </p>
    </blockquote>

    <p><strong>Request Body (JSON):</strong></p>

    <pre><code class="language-json">{
  "postId": "die-post-id",
  "content": "Ist das noch verfügbar?"
}</code></pre>

    <p><strong>Validierungen:</strong></p>

    <ul>
      <li><code>content</code> darf nicht leer sein</li>
      <li><code>content</code> darf maximal 2000 Zeichen lang sein</li>
    </ul>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
  "success": true,
  "message": {
    "id": "1720000000_abc123",
    "postId": "1720000000_xyz",
    "author": "Hans Muster",
    "authorEmail": "hans.muster@kzu.ch",
    "content": "Ist das noch verfügbar?",
    "createdAt": "2025-07-01T10:05:00.000Z"
  }
}</code></pre>

    <p><strong>Fehler-Antwort:</strong></p>

    <pre><code class="language-json">{ "error": "Authentifizierung erforderlich" }
{ "error": "Ungültiger oder abgelaufener Token" }
{ "error": "Nachricht darf maximal 2000 Zeichen lang sein" }</code></pre>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">const token = localStorage.getItem('auth_token')

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
}</code></pre>

    <hr>

    <h3 id="post-apifeedback">POST /api/feedback</h3>

    <p><strong>Was macht er?</strong> Feedback-Formular einsenden.</p>
    <p><strong>Braucht Token?</strong> ❌ Nein</p>
    <p><strong>Rate Limit:</strong> Maximal <strong>5 Requests pro Stunde</strong> pro IP-Adresse.</p>

    <p><strong>Request Body (JSON):</strong></p>

    <pre><code class="language-json">{
  "email": "hans.muster@kzu.ch",
  "message": "Das ist mein Feedback...",
  "name": "Hans Muster",
  "category": "Bug"
}</code></pre>

    <p>
      <strong>Pflichtfelder:</strong> <code>email</code>, <code>message</code><br>
      <strong>Optionale Felder:</strong> <code>name</code>, <code>category</code>
    </p>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{ "success": true }</code></pre>

    <p><strong>Fehler:</strong></p>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Code</th>
          <th>Bedeutung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td>400</td><td>E-Mail oder Nachricht fehlt</td></tr>
        <tr><td>429</td><td>Zu viele Anfragen</td></tr>
        <tr><td>502</td><td>Formspree-Dienst nicht erreichbar</td></tr>
        </tbody>
      </table>
    </div>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">try {
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
}</code></pre>

    <hr>

    <h3 id="post-apiheartbeat">POST /api/heartbeat</h3>

    <p>
      <strong>Was macht er?</strong>
      Teilt dem Server mit, dass ein User noch online ist. Gibt außerdem zurück,
      ob der User weitergeleitet werden soll.
    </p>

    <p><strong>Braucht Token?</strong> ❌ Nein, Token ist optional.</p>

    <p><strong>Request Body (JSON):</strong></p>

    <pre><code class="language-json">{
  "id": "eine-einzigartige-client-id"
}</code></pre>

    <blockquote>
      <p>
        Die <code>id</code> muss eine einzigartige ID sein, die du für jeden Browser-Tab erzeugst,
        z.B. mit <code>crypto.randomUUID()</code>.
      </p>
    </blockquote>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
  "redirect": null
}</code></pre>

    <p>Oder, wenn ein Admin eine Weiterleitung gesetzt hat:</p>

    <pre><code class="language-json">{
  "redirect": {
    "url": "/neue-seite",
    "timestamp": 1720000000000
  }
}</code></pre>

    <p><strong>Wie verwenden:</strong></p>

    <pre><code class="language-typescript">const clientId = localStorage.getItem('client_id') || crypto.randomUUID()
localStorage.setItem('client_id', clientId)

const token = localStorage.getItem('auth_token')

setInterval(async () => {
  const result = await $fetch('/api/heartbeat', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: { id: clientId }
  })

  if (result.redirect) {
    navigateTo(result.redirect.url)
  }
}, 10_000)</code></pre>

    <hr>

    <h3 id="get-apiadminstats">GET /api/admin/stats</h3>

    <p><strong>Was macht er?</strong> Statistiken abrufen: Seitenaufrufe und Online-User.</p>
    <p><strong>Braucht Token?</strong> ✅ Ja – <strong>nur Admin</strong></p>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
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
}</code></pre>

    <blockquote>
      <p><code>users</code> enthält User, die in den letzten 15 Sekunden einen Heartbeat geschickt haben.</p>
    </blockquote>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">const token = localStorage.getItem('auth_token')

const stats = await $fetch('/api/admin/stats', {
  headers: { Authorization: `Bearer ${token}` }
})

console.log(`${stats.totalViews} Aufrufe, ${stats.onlineCount} online`)</code></pre>

    <hr>

    <h3 id="post-apiadminstats">POST /api/admin/stats</h3>

    <p><strong>Was macht er?</strong> Weiterleitung für alle oder einen bestimmten Online-User setzen.</p>
    <p><strong>Braucht Token?</strong> ✅ Ja – <strong>nur Admin</strong></p>

    <p><strong>Request Body (JSON):</strong></p>

    <pre><code class="language-json">{
  "url": "/neue-seite",
  "targetId": "abc-123"
}</code></pre>

    <blockquote>
      <p>
        <code>targetId</code> ist optional. Ohne <code>targetId</code> werden alle Online-User weitergeleitet.
      </p>
    </blockquote>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{ "success": true }</code></pre>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">const token = localStorage.getItem('auth_token')

await $fetch('/api/admin/stats', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: { url: '/wartung' }
})

await $fetch('/api/admin/stats', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: { url: '/ban', targetId: 'abc-123' }
})</code></pre>

    <hr>

    <h3 id="get-apiadminblocklist">GET /api/admin/blocklist</h3>

    <p><strong>Was macht er?</strong> Alle gesperrten Wörter abrufen.</p>
    <p><strong>Braucht Token?</strong> ✅ Ja – <strong>nur Admin</strong></p>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
  "success": true,
  "words": ["schimpfwort1", "schimpfwort2"]
}</code></pre>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">const token = localStorage.getItem('auth_token')
const { data } = await useFetch('/api/admin/blocklist', {
  headers: { Authorization: `Bearer ${token}` }
})
const words = data.value?.words</code></pre>

    <hr>

    <h3 id="post-apiadminblocklist">POST /api/admin/blocklist</h3>

    <p><strong>Was macht er?</strong> Die gesamte Blocklist ersetzen.</p>
    <p><strong>Braucht Token?</strong> ✅ Ja – <strong>nur Admin</strong></p>

    <p><strong>Request Body (JSON):</strong></p>

    <pre><code class="language-json">{
  "words": ["wort1", "wort2", "wort3"]
}</code></pre>

    <blockquote>
      <p>Schicke ein leeres Array <code>[]</code>, um alle gesperrten Wörter zu löschen.</p>
    </blockquote>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{ "success": true }</code></pre>

    <p><strong>Fehler:</strong></p>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Code</th>
          <th>Bedeutung</th>
        </tr>
        </thead>
        <tbody>
        <tr><td>400</td><td><code>words</code> ist kein Array</td></tr>
        </tbody>
      </table>
    </div>

    <p><strong>Beispiel:</strong></p>

    <pre><code class="language-typescript">const token = localStorage.getItem('auth_token')

await $fetch('/api/admin/blocklist', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: { words: ['böseswort', 'nocheinbösenwort'] }
})</code></pre>

    <hr>

    <h3 id="post-apitradescomplete">POST /api/trades/complete</h3>

    <p><strong>Was macht er?</strong> Einen Tausch als abgeschlossen markieren.</p>

    <blockquote>
      <p>
        ⚠️ <strong>Hinweis:</strong>
        Dieser Endpunkt ist noch <strong>nicht vollständig implementiert</strong>. Er gibt immer 50 Punkte zurück.
      </p>
    </blockquote>

    <p><strong>Braucht Token?</strong> ❌ Derzeit nicht.</p>

    <p><strong>Request Body (JSON):</strong></p>

    <pre><code class="language-json">{
  "itemTitle": "Mathe-Buch",
  "itemDescription": "Hardcover, Ausgabe 2023",
  "partnerLogin": "max.mueller@kzu.ch",
  "partnerId": "user-partner-id"
}</code></pre>

    <p>
      <strong>Pflichtfelder:</strong>
      <code>itemTitle</code>, <code>partnerLogin</code>, <code>partnerId</code>
    </p>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
  "success": true,
  "message": "Handel erfolgreich abgeschlossen! Beide Spieler erhalten 50 Punkte.",
  "pointsAwarded": 50
}</code></pre>

    <hr>

    <h3 id="get-apiusersavailable">GET /api/users/available</h3>

    <p><strong>Was macht er?</strong> Liste aller verfügbaren User zum Handeln abrufen.</p>

    <blockquote>
      <p>⚠️ <strong>Hinweis:</strong> Noch <strong>nicht implementiert</strong>. Gibt immer ein leeres Array zurück.</p>
    </blockquote>

    <p><strong>Braucht Token?</strong> ❌ Derzeit nicht.</p>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
  "users": []
}</code></pre>

    <hr>

    <h3 id="get-apiuserspoints">GET /api/users/points</h3>

    <p><strong>Was macht er?</strong> Punkte des aktuellen Users abrufen.</p>

    <blockquote>
      <p>⚠️ <strong>Hinweis:</strong> Noch <strong>nicht implementiert</strong>. Gibt immer <code>0</code> zurück.</p>
    </blockquote>

    <p><strong>Braucht Token?</strong> ❌ Derzeit nicht.</p>

    <p><strong>Erfolgreiche Antwort (200):</strong></p>

    <pre><code class="language-json">{
  "points": 0
}</code></pre>

    <hr>

    <h2 id="8-bilder-anzeigen">8. Bilder anzeigen</h2>

    <p>Bilder werden in MinIO gespeichert und über einen Proxy-Pfad <code>/uploads/</code> ausgeliefert.</p>

    <p>
      In der Datenbank stehen nur die <strong>Schlüssel</strong> (Keys),
      z.B. <code>1720000000_xyz.jpg</code>.
    </p>

    <p>Um ein Bild anzuzeigen, hänge den Key an den Pfad <code>/uploads/</code>:</p>

    <pre><code>/uploads/1720000000_xyz.jpg</code></pre>

    <p><strong>In Vue:</strong></p>

    <pre><code class="language-html">&lt;img :src="`/uploads/${post.mainImage}`" :alt="post.title" /&gt;</code></pre>

    <p><strong>Mit dem Nuxt Image-Modul:</strong></p>

    <pre><code class="language-html">&lt;NuxtImg :src="`/uploads/${post.mainImage}`" :alt="post.title" /&gt;</code></pre>

    <hr>

    <h2 id="9-welche-routen-brauchen-einen-token">9. Welche Routen brauchen einen Token?</h2>

    <div class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Route</th>
          <th>Methode</th>
          <th>Benötigte Rolle</th>
        </tr>
        </thead>
        <tbody>
        <tr><td><code>/api/upload</code></td><td>POST</td><td><code>user</code> oder <code>admin</code></td></tr>
        <tr><td><code>/api/delete</code></td><td>POST</td><td><code>user</code> oder <code>admin</code></td></tr>
        <tr><td><code>/api/create-post</code></td><td>POST</td><td><code>user</code> oder <code>admin</code></td></tr>
        <tr><td><code>/api/messages</code></td><td>POST</td><td><code>user</code> oder <code>admin</code></td></tr>
        <tr><td><code>/api/admin/*</code></td><td>GET/POST</td><td><strong>nur <code>admin</code></strong></td></tr>
        </tbody>
      </table>
    </div>

    <p>Alle anderen Routen sind öffentlich zugänglich (kein Token nötig).</p>

    <hr>

    <h2 id="10-fehlerbehandlung">10. Fehlerbehandlung</h2>

    <p>Alle HTTP-Fehler haben dieses Format:</p>

    <pre><code class="language-json">{
  "statusCode": 401,
  "statusMessage": "Nicht eingeloggt"
}</code></pre>

    <p>
      Bei <code>$fetch</code> wird bei einem HTTP-Fehler automatisch eine Exception geworfen.
      Du fängst sie mit <code>try/catch</code>:
    </p>

    <pre><code class="language-typescript">try {
  const result = await $fetch('/api/upload', { ... })
} catch (err: any) {
  if (err.status === 401) {
    navigateTo('/login')
  } else {
    alert(err.data?.statusMessage || 'Unbekannter Fehler')
  }
}</code></pre>

    <p>
      <strong>Wichtig für <code>/api/messages</code>:</strong>
      Diese Endpunkte werfen keine HTTP-Fehler, sondern geben ein Objekt mit <code>error</code>-Feld zurück:
    </p>

    <pre><code class="language-typescript">const result = await $fetch('/api/messages', { ... })
if (result.error) {
  console.error(result.error)
}</code></pre>

    <hr>

    <h2 id="11-komplette-beispiele-copy-paste">11. Komplette Beispiele (Copy-Paste)</h2>

    <h3>Composable: <code>useAuth</code></h3>

    <p>Erstelle <code>app/composables/useAuth.ts</code>:</p>

    <pre><code class="language-typescript">export function useAuth() {
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
}</code></pre>

    <h3>Seite: Login</h3>

    <pre><code class="language-vue">&lt;script setup lang="ts"&gt;
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
&lt;/script&gt;

&lt;template&gt;
  &lt;form @submit.prevent="handleLogin"&gt;
    &lt;input v-model="form.login" type="email" placeholder="E-Mail" required /&gt;
    &lt;input v-model="form.password" type="password" placeholder="Passwort" required /&gt;
    &lt;p v-if="error" style="color: red"&gt;{{ error }}&lt;/p&gt;
    &lt;button type="submit" :disabled="loading"&gt;
      {{ loading ? 'Lade...' : 'Einloggen' }}
    &lt;/button&gt;
  &lt;/form&gt;
&lt;/template&gt;</code></pre>

    <h3>Seite: Alle Posts laden und anzeigen</h3>

    <pre><code class="language-vue">&lt;script setup lang="ts"&gt;
const { data, pending, error } = await useFetch('/api/images')
const posts = computed(() => data.value?.posts ?? [])
&lt;/script&gt;

&lt;template&gt;
  &lt;div v-if="pending"&gt;Lädt...&lt;/div&gt;
  &lt;div v-else-if="error"&gt;Fehler beim Laden&lt;/div&gt;
  &lt;div v-else&gt;
    &lt;div v-for="post in posts" :key="post.id"&gt;
      &lt;img :src="`/uploads/${post.mainImage}`" :alt="post.title" /&gt;
      &lt;h2&gt;{{ post.title }}&lt;/h2&gt;
      &lt;p&gt;{{ post.description }}&lt;/p&gt;
      &lt;span&gt;{{ post.category }}&lt;/span&gt;
      &lt;span v-if="post.wishes"&gt;Tauschwunsch: {{ post.wishes }}&lt;/span&gt;
      &lt;small&gt;von {{ post.ownerName }}&lt;/small&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

    <h3>Post hochladen</h3>

    <pre><code class="language-vue">&lt;script setup lang="ts"&gt;
const { authHeaders, isLoggedIn } = useAuth()

const title = ref('')
const description = ref('')
const category = ref('Bücher')
const wishes = ref('')
const files = ref&lt;FileList | null&gt;(null)
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
&lt;/script&gt;

&lt;template&gt;
  &lt;form @submit.prevent="handleUpload"&gt;
    &lt;input v-model="title" placeholder="Titel" required /&gt;
    &lt;textarea v-model="description" placeholder="Beschreibung" required /&gt;
    &lt;select v-model="category"&gt;
      &lt;option&gt;Schulmaterial&lt;/option&gt;
      &lt;option&gt;Stifte&lt;/option&gt;
      &lt;option&gt;Bücher&lt;/option&gt;
      &lt;option&gt;Sportmaterialien&lt;/option&gt;
      &lt;option&gt;Anderes&lt;/option&gt;
    &lt;/select&gt;
    &lt;input v-model="wishes" placeholder="Was möchtest du im Tausch?" /&gt;
    &lt;input type="file" multiple accept="image/*" @change="e =&gt; files = (e.target as HTMLInputElement).files" /&gt;
    &lt;label&gt;
      &lt;input v-model="rulesAccepted" type="checkbox" /&gt;
      Ich akzeptiere die Regeln
    &lt;/label&gt;
    &lt;p v-if="error" style="color: red"&gt;{{ error }}&lt;/p&gt;
    &lt;button type="submit" :disabled="loading"&gt;
      {{ loading ? 'Wird hochgeladen...' : 'Angebot erstellen' }}
    &lt;/button&gt;
  &lt;/form&gt;
&lt;/template&gt;</code></pre>

    <hr>

    <h2 id="12-architekturübersicht">12. Architekturübersicht</h2>

    <pre><code>┌──────────────────────────────────────────────────────┐
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
└───────────────┘</code></pre>

    <hr>

    <h2>Zusammenfassung: Die wichtigsten Punkte</h2>

    <ol>
      <li><strong>Alle API-Calls</strong> gehen an <code>/api/...</code> – keine externe URL nötig</li>
      <li><strong>Token</strong> nach Login speichern, bei gesicherten Routen als <code>Authorization: Bearer TOKEN</code> Header mitschicken</li>
      <li><strong>Bilder</strong> werden unter <code>/uploads/KEY</code> angezeigt (Key kommt aus der Post-Antwort)</li>
      <li><strong>Kategorien</strong> sind fest: <code>Schulmaterial</code>, <code>Stifte</code>, <code>Bücher</code>, <code>Sportmaterialien</code>, <code>Anderes</code></li>
      <li><strong>Upload</strong> verwendet <code>FormData</code> (kein JSON), <code>Content-Type</code> wird automatisch gesetzt</li>
      <li><strong>Fehler</strong> bei <code>$fetch</code> kommen als Exception – immer <code>try/catch</code> verwenden</li>
      <li><strong>Nachrichten-POST</strong> gibt keinen HTTP-Fehler, sondern ein <code>{ error: "..." }</code> Objekt zurück</li>
      <li><strong>Heartbeat</strong> alle 10 Sekunden senden, um Online-Status zu halten</li>
    </ol>
  </main>
</template>

<style scoped>
.documentation-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
  line-height: 1.7;
}

.documentation-page h1 {
  font-size: 2.25rem;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.documentation-page h2 {
  font-size: 1.75rem;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}

.documentation-page h3 {
  font-size: 1.35rem;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.documentation-page p {
  margin: 0.75rem 0;
}

.documentation-page ul,
.documentation-page ol {
  padding-left: 1.5rem;
  margin: 1rem 0;
}

.documentation-page li {
  margin: 0.35rem 0;
}

.documentation-page blockquote {
  margin: 1.25rem 0;
  padding: 0.75rem 1rem;
  border-left: 4px solid #94a3b8;
  background: #f8fafc;
}

.documentation-page pre {
  overflow-x: auto;
  padding: 1rem;
  border-radius: 0.5rem;
  background: #0f172a;
  color: #e2e8f0;
}

.documentation-page code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}

.documentation-page :not(pre) > code {
  padding: 0.15rem 0.35rem;
  border-radius: 0.25rem;
  background: #f1f5f9;
  color: #0f172a;
}

.table-wrapper {
  overflow-x: auto;
}

.documentation-page table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.documentation-page th,
.documentation-page td {
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.75rem;
  text-align: left;
  vertical-align: top;
}

.documentation-page th {
  background: #f1f5f9;
  font-weight: 700;
}

.documentation-page hr {
  margin: 2rem 0;
  border: 0;
  border-top: 1px solid #cbd5e1;
}
</style>