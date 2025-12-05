-- Simple Postgres schema for RFP MVP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  contact_name text,
  contact_email text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE rfps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text,
  description_raw text,
  structured_json jsonb,
  total_budget numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfp_id uuid REFERENCES rfps(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  raw_email_body text,
  parsed_json jsonb,
  received_at timestamptz DEFAULT now()
);
