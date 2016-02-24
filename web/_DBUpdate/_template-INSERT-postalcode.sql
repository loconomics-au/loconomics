INSERT INTO [postalcode]
           ([PostalCodeID]
           ,[PostalCode]
           ,[City]
           ,[StateProvinceID]
           ,[CountryID]
           ,[Latitude]
           ,[Longitude]
           ,[TimeZone]
           ,[DST]
           ,[Location]
           ,[PostalCodeType]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           (@PostalCodeID
           ,@PostalCode
           ,@City
           ,@StateProvinceID
           ,@CountryID
           ,@Latitude
           ,@Longitude
           ,@TimeZone
           ,@DST
           ,@Location
           ,@PostalCodeType
           ,@CreatedDate
           ,@UpdatedDate
           ,@ModifiedBy)