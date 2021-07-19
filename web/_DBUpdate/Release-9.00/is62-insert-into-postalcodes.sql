
IF OBJECT_ID('auspostcodes', 'U') IS NULL 
BEGIN
  ;THROW 60000, 'table auspostcodes does not exist. run australian_postcodes.sql before this script', 1
END
GO

-- add active column with default
IF NOT EXISTS(SELECT 1 FROM sys.columns 
    WHERE Name = N'Active'
    AND Object_ID = Object_ID(N'postalcode'))
BEGIN
    ALTER TABLE postalcode
	ADD Active BIT NOT NULL
	CONSTRAINT [DF_postalcode_Active] DEFAULT 0
END
GO

-- remove duplicate postalcode, city combos
DELETE
FROM postalcode
WHERE [PostalCodeID] NOT IN (
	SELECT MAX([PostalCodeID])
	FROM postalcode
	GROUP BY [PostalCode], [City])
GO

-- set pk fields as not null
ALTER TABLE [postalcode] ALTER COLUMN [PostalCode] NVARCHAR (25) NOT NULL;
ALTER TABLE [postalcode] ALTER COLUMN City NVARCHAR (250) NOT NULL;
GO

-- set PK as postalcode, city combo 
IF NOT EXISTS(SELECT 1 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_NAME='PK_postalcode_PostalCode_City')
BEGIN

	/****** Object:  Index [PK_postalcode]    Script Date: 17/07/2021 5:05:02 PM ******/
	ALTER TABLE [postalcode] ADD  CONSTRAINT PK_postalcode_PostalCode_City PRIMARY KEY CLUSTERED 
	(
		[PostalCode] ASC,
		[City] ASC
	)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]

END
GO

-- add an identity column
IF (OBJECTPROPERTY(OBJECT_ID('postalcode'), 'TableHasIdentity') = 0) 
BEGIN
	-- 
	ALTER TABLE postalcode
	DROP COLUMN PostalCodeID

	ALTER TABLE postalcode add PostalCodeID INT IDENTITY
END
GO

IF NOT EXISTS(SELECT 1 FROM postalcode WHERE PostalCode = '0200')
BEGIN
	-- current records
	DELETE FROM postalcode WHERE CountryID = 15

	INSERT INTO postalcode (PostalCode, City, StateProvinceID, CountryID, 
		Latitude, Longitude, StandardOffset, DST,
		[Location], PostalCodeType, CreatedDate, UpdatedDate,
		ModifiedBy, MunicipalityID, CountyID, Active)
	SELECT pcode, 
		locality, 
		sp.StateProvinceID, 15, 
		lat, long, 0, 0, 
		NULL, NULL, GETDATE(), GETDATE(),
		'sam w', 0, 0, 0
	FROM auspostcodes apc
	JOIN stateprovince sp on apc.[state] = sp.StateProvinceCode
	LEFT OUTER JOIN postalcode pc on pc.PostalCode = apc.pcode
	WHERE sp.CountryID = 15
	AND postalcodeId IS NULL
	GROUP BY pcode, 
		apc.locality, 
		sp.StateProvinceID,
		lat, long
END
GO

-- Activate postcodea around Darebin
-- Yarra
UPDATE postalcode 
SET Active = 1
WHERE postalcode IN ('3067', '3078', '3121', '3068', '3066', '3065', '3054')

-- Moreland
UPDATE postalcode 
SET Active = 1
WHERE postalcode IN ('3058', '3056', 	'3057', '3055', '3060', '3068', '3046', '3043', '3044')
	
-- Banyule
UPDATE postalcode 
SET Active = 1
WHERE postalcode IN ('3084', '3081', '3088', '3083', '3079', '3093', '3085', '3094', '3087', '3085')

-- Whittlesea
UPDATE postalcode 
SET Active = 1
WHERE postalcode IN ('3753', '3754', '3757', '3076', '3083', '3075', '3082', '3752', '3074', '3750', '3751')

-- Darebin
UPDATE postalcode 
SET Active = 1
WHERE postalcode IN ('3072', '3083', '3086', '3085', '3070', '3073', '3071')

GO