CREATE VIEW "ViewRequestYears" AS
SELECT DISTINCT 
    EXTRACT(YEAR FROM created_at) AS year
FROM 
    public."ChatMessages"
ORDER BY 
    year;
