CREATE VIEW "ViewUserCreationYears" AS
SELECT DISTINCT EXTRACT(YEAR FROM created_at) AS year
FROM "OverviewUsers"
WHERE (raw_user_meta_data->>'user_type') IN ('technician', 'farmer');
