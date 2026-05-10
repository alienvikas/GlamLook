-- Makeup Artist App - PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Artists (app users)
CREATE TABLE IF NOT EXISTS artists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  bio           TEXT,
  specialties   TEXT[],
  avatar_url    VARCHAR(500),
  instagram     VARCHAR(100),
  facebook      VARCHAR(100),
  website       VARCHAR(200),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id   UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150),
  phone       VARCHAR(20),
  notes       TEXT,
  skin_type   VARCHAR(50),
  allergies   TEXT,
  avatar_url  VARCHAR(500),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Services offered by artist
CREATE TABLE IF NOT EXISTS services (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id   UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  duration    INTEGER NOT NULL, -- minutes
  price       NUMERIC(10,2) NOT NULL,
  category    VARCHAR(50),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id     UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id    UUID REFERENCES services(id) ON DELETE SET NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  duration      INTEGER NOT NULL, -- minutes
  location      VARCHAR(255),
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  notes         TEXT,
  total_amount  NUMERIC(10,2),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  artist_id       UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL,
  method          VARCHAR(30) DEFAULT 'cash' CHECK (method IN ('cash','card','upi','bank_transfer','other')),
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','refunded')),
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio items
CREATE TABLE IF NOT EXISTS portfolio_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id   UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  title       VARCHAR(150),
  description TEXT,
  before_url  VARCHAR(500),
  after_url   VARCHAR(500) NOT NULL,
  tags        TEXT[],
  is_public   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_artist ON clients(artist_id);
CREATE INDEX IF NOT EXISTS idx_services_artist ON services(artist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_artist ON appointments(artist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payments_artist ON payments(artist_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_artist ON portfolio_items(artist_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_artists_updated
  BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_clients_updated
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_services_updated
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_appointments_updated
  BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
