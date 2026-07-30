-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id BIGSERIAL PRIMARY KEY,
    equipment_id BIGINT NOT NULL,
    requested_by_id BIGINT NOT NULL,
    assigned_to_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL,
    equipment_status_before_maintenance VARCHAR(50),
    created_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completion_notes TEXT,
    result VARCHAR(50),
    CONSTRAINT fk_maintenance_equipment FOREIGN KEY (equipment_id) REFERENCES equipments(id),
    CONSTRAINT fk_maintenance_requested_by FOREIGN KEY (requested_by_id) REFERENCES users(id),
    CONSTRAINT fk_maintenance_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id)
);
