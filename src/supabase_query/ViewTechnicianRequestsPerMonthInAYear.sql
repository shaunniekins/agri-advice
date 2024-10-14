CREATE VIEW "ViewTechnicianRequestsPerMonthInAYear" AS
SELECT DISTINCT 
    EXTRACT(YEAR FROM cm1.created_at) AS year,
    EXTRACT(MONTH FROM cm1.created_at) AS month,
    LEAST(cm1.sender_id, cm1.receiver_id) AS user_1,
    GREATEST(cm1.sender_id, cm1.receiver_id) AS user_2
FROM 
    public."ChatMessages" cm1
JOIN 
    public."ChatMessages" cm2
ON 
    cm1.sender_id = cm2.receiver_id
    AND cm1.receiver_id = cm2.sender_id
WHERE 
    cm1.sender_id != cm1.receiver_id
ORDER BY 
    year, month, user_1, user_2;
