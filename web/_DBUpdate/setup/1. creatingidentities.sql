SELECT 
  [schema] = s.name,
  [table] = t.name
FROM sys.schemas AS s
INNER JOIN sys.tables AS t
  ON s.[schema_id] = t.[schema_id]
WHERE EXISTS 
(
  SELECT 1 FROM sys.identity_columns
    WHERE [object_id] = t.[object_id]
);