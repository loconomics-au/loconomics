SELECT 
    'ALTER TABLE ' + OBJECT_SCHEMA_NAME(dc.parent_object_id) + '.' + OBJECT_NAME(dc.parent_object_id) + 
    ' ADD CONSTRAINT ' + dc.name + ' DEFAULT(' + definition 
    + ') FOR ' + c.name
FROM
    sys.default_constraints dc
INNER JOIN 
    sys.columns c ON dc.parent_object_id = c.object_id 
                  AND dc.parent_column_id = c.column_id