-- Base du compteur de visites (Cloudflare D1)
CREATE TABLE IF NOT EXISTS hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,          -- date et heure (millisecondes)
  day TEXT NOT NULL,            -- AAAA-MM-JJ
  path TEXT NOT NULL,           -- page vue (/article.html?id=…) ou action (evt:formation:…)
  ref TEXT,                     -- provenance (Facebook, Google, Accès direct…), vide pour la navigation interne
  country TEXT,                 -- code pays (CG, FR…)
  city TEXT,
  device TEXT,                  -- Téléphone / Ordinateur / Tablette
  vid TEXT                      -- identifiant anonyme, valable un jour
);
CREATE INDEX IF NOT EXISTS hits_day ON hits (day);
CREATE INDEX IF NOT EXISTS hits_ts ON hits (ts);
