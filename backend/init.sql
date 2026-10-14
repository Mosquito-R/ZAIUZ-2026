CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS series (
    id SERIAL PRIMARY KEY,
    series_name VARCHAR(100) NOT NULL,
    min_value DOUBLE PRECISION NOT NULL,
    max_value DOUBLE PRECISION NOT NULL,
    color VARCHAR(7) NOT NULL CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
    icon VARCHAR(20),
    unit VARCHAR(20),
    CONSTRAINT min_max_check CHECK (min_value < max_value)
);

CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    sensor_name VARCHAR(100) NOT NULL,
    api_key_hash VARCHAR(64) NOT NULL UNIQUE,
    last_measurement_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    series_id INT NOT NULL REFERENCES series(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS measurements (
    id SERIAL PRIMARY KEY,
    measurement_value DOUBLE PRECISION NOT NULL,
    series_id INT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    sensor_id INT REFERENCES sensors(id) ON DELETE SET NULL,
    measurement_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_last_measurement()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sensors 
    SET last_measurement_at = NEW.measurement_timestamp 
    WHERE id = NEW.sensor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_measurement ON measurements;
CREATE TRIGGER trigger_update_last_measurement
AFTER INSERT ON measurements
FOR EACH ROW
EXECUTE FUNCTION update_last_measurement();

CREATE INDEX IF NOT EXISTS idx_measurements_timestamp ON measurements (series_id, measurement_timestamp);
CREATE INDEX IF NOT EXISTS idx_sensors_api_key_hash ON sensors (api_key_hash);