-- PostgreSQL reference schema. Run in a disposable database only.
CREATE TABLE actors (
  id text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('AGENT','MANAGER','STORE','FINANCE','PROVIDER'))
);
CREATE TABLE orders (
  id text PRIMARY KEY,
  delivered_at timestamptz NOT NULL,
  currency text NOT NULL CHECK (currency = 'VND'),
  status text NOT NULL CHECK (status = 'PAID')
);
CREATE TABLE order_lines (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id),
  product_name text NOT NULL,
  category text NOT NULL,
  purchased_qty integer NOT NULL CHECK (purchased_qty > 0),
  gross_vnd integer NOT NULL CHECK (gross_vnd >= 0),
  discount_vnd integer NOT NULL CHECK (discount_vnd BETWEEN 0 AND gross_vnd),
  net_paid_vnd integer NOT NULL CHECK (net_paid_vnd = gross_vnd - discount_vnd)
);
CREATE TABLE order_units (
  id text PRIMARY KEY,
  line_id text NOT NULL REFERENCES order_lines(id),
  ordinal integer NOT NULL CHECK (ordinal > 0),
  net_paid_vnd integer NOT NULL CHECK (net_paid_vnd >= 0),
  UNIQUE(line_id, ordinal)
);
CREATE TABLE return_requests (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id),
  store_id text NOT NULL CHECK (store_id IN ('S01','S02','S03')),
  reason_code text NOT NULL CHECK (reason_code IN ('NOT_SUITABLE','DAMAGED','WRONG_ITEM')),
  requester_id text NOT NULL REFERENCES actors(id),
  status text NOT NULL CHECK (status IN ('AWAITING_APPROVAL','APPROVED','REJECTED','CANCELLED','DISPUTED','ACCEPTED','COMPLETED')),
  amount_vnd integer NOT NULL CHECK (amount_vnd >= 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
CREATE TABLE return_units (
  return_id text NOT NULL REFERENCES return_requests(id),
  unit_id text NOT NULL REFERENCES order_units(id),
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY(return_id, unit_id)
);
-- A reserved or completed unit cannot be allocated to another live return.
CREATE UNIQUE INDEX one_active_return_per_unit ON return_units(unit_id) WHERE active;
CREATE TABLE refund_instructions (
  id text PRIMARY KEY,
  return_id text NOT NULL UNIQUE REFERENCES return_requests(id),
  amount_vnd integer NOT NULL CHECK (amount_vnd >= 0),
  status text NOT NULL CHECK (status IN ('PENDING','UNKNOWN','FAILED','SUCCEEDED')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
CREATE TABLE payment_attempts (
  id text PRIMARY KEY,
  refund_id text NOT NULL REFERENCES refund_instructions(id),
  attempt_no integer NOT NULL CHECK (attempt_no > 0),
  provider_ref text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('PENDING','UNKNOWN','FAILED','SUCCEEDED')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE(refund_id, attempt_no)
);
CREATE TABLE idempotency_records (
  key text PRIMARY KEY,
  fingerprint text NOT NULL,
  actor_id text NOT NULL REFERENCES actors(id),
  response_json jsonb NOT NULL
);
CREATE TABLE payment_events (
  id text PRIMARY KEY,
  attempt_id text NOT NULL REFERENCES payment_attempts(id),
  fingerprint text NOT NULL,
  disposition text NOT NULL CHECK (disposition IN ('APPLIED','IGNORED_TERMINAL')),
  created_at timestamptz NOT NULL
);
CREATE TABLE audit_events (
  id bigserial PRIMARY KEY,
  entity_id text NOT NULL,
  actor_id text NOT NULL REFERENCES actors(id),
  action text NOT NULL,
  before_status text,
  after_status text,
  detail jsonb NOT NULL,
  created_at timestamptz NOT NULL
);
