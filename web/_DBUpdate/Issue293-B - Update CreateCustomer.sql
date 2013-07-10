/****** Object:  StoredProcedure [dbo].[CreateCustomer]    Script Date: 07/10/2013 20:46:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 16/04/2012
-- Description:	Create a Loconomics User as
-- only Customer profile and minimum information
-- (from the Register page or Facebook Login).
-- =============================================
ALTER PROCEDURE [dbo].[CreateCustomer]
	-- Add the parameters for the stored procedure here
	
		@UserID int,
		@Firstname varchar(45),
        @Lastname varchar(145),
		@Lang int,
		@CountryId int,
        @GenderID int = -1,
		@PublicBio varchar(500) = null
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    INSERT INTO dbo.users (
		UserID,
		FirstName,
		LastName,
		MiddleIn,
		SecondLastName,
		GenderID,
		PreferredLanguageID,
		PreferredCountryID,
		PublicBio,
		IsProvider,
		IsCustomer,
		CreatedDate,
		UpdatedDate,
		ModifiedBy,
		Active
	) VALUES (
		@UserID,
		@Firstname,
		@Lastname,
		'',
		'',
		coalesce(@GenderID, -1),
		@Lang,
		@CountryId,
		@PublicBio,
		0,
		1,
		GETDATE(),
		GETDATE(),
		'SYS',
		1
	)
	
	-- Check alerts for the user to get its state updated
	EXEC TestAllUserAlerts @UserID
END
