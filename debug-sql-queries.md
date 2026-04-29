# Debug SQL Queries for BloodLink Request Visibility Issue

## 1. Find Admin User ID
```sql
-- Find your admin user by email or name
SELECT id, full_name, email, role FROM profiles WHERE role = 'admin';
```

## 2. Check Admin Center Assignment
```sql
-- Replace [ACTUAL_ADMIN_USER_ID] with the ID from step 1
SELECT * FROM blood_centers WHERE admin_id = '[ACTUAL_ADMIN_USER_ID]';
```

## 3. Check All Centers and Their Admins
```sql
-- See all centers and which admins are assigned
SELECT id, name, city, admin_id FROM blood_centers WHERE is_active = true;
```

## 4. Find Your Specific Request
```sql
-- Find requests by patient name or hospital
SELECT * FROM blood_requests WHERE patient_name ILIKE '%PATIENT_NAME%' OR hospital_name ILIKE '%HOSPITAL_NAME%';
```

## 5. Check Request Details
```sql
-- Replace [ACTUAL_REQUEST_ID] with the ID from step 4
SELECT * FROM blood_requests WHERE id = '[ACTUAL_REQUEST_ID]';
```

## 6. Check All Pending Requests
```sql
-- See all pending requests in the system
SELECT 
  id, 
  patient_name, 
  hospital_name, 
  blood_type, 
  status, 
  center_id, 
  created_at 
FROM blood_requests 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

## 7. Check Center-Request Relationship
```sql
-- See which requests belong to which centers
SELECT 
  br.id,
  br.patient_name,
  br.hospital_name,
  br.center_id,
  bc.name as center_name,
  bc.admin_id
FROM blood_requests br
LEFT JOIN blood_centers bc ON br.center_id = bc.id
WHERE br.status = 'pending';
```

## How to Use:
1. Open Supabase SQL Editor
2. Run Query 1 to find your admin user ID
3. Replace placeholders in subsequent queries with actual IDs
4. Share the results so I can identify the exact issue
