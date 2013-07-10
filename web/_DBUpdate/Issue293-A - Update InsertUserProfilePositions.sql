/****** Object:  StoredProcedure [dbo].[InsertUserProfilePositions]    Script Date: 07/10/2013 20:44:49 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[InsertUserProfilePositions]

@UserID int,
@PositionID int,
@LanguageID int,
@CountryID int,
@CancellationPolicyID int

AS

DECLARE @ResultMessage varchar(50)

BEGIN TRY

	INSERT INTO userprofilepositions (
		UserID, PositionID, LanguageID, CountryID, CreateDate, UpdatedDate, ModifiedBy, Active, StatusID, PositionIntro, CancellationPolicyID
	) VALUES(
		@UserID,@PositionID,@LanguageID,@CountryID, GETDATE(), GETDATE(), 'sys', 1, 2, null, @CancellationPolicyID
	)
	
	-- Check alerts for the position to get its state updated
	EXEC TestAllUserAlerts @UserID, @PositionID

	SELECT  'Success' as Result

END TRY

BEGIN CATCH

 SET @ResultMessage =  ERROR_MESSAGE();

IF @ResultMessage like 'Violation of PRIMARY KEY%'
 
BEGIN

	-- SELECT 'You already have this position loaded' as Result

	IF EXISTS (SELECT * FROM UserProfilePositions WHERE
		UserID = @UserID AND PositionID = @PositionID
		AND LanguageID = @LanguageID AND CountryID = @CountryID
		AND Active = 0) BEGIN
		
		SELECT 'Position could not be added' As Result
		
	END ELSE BEGIN
	
		-- Enable this position and continue, no error
		UPDATE UserProfilePositions
		SET StatusID = 2
			,UpdatedDate = GETDATE()
		WHERE 
			UserID = @UserID AND PositionID = @PositionID
			AND LanguageID = @LanguageID AND CountryID = @CountryID

		SELECT  'Success' as Result
	END
END

ELSE
BEGIN

	SELECT 'Sorry, it appears we have an error: ' + @ResultMessage as Result
	
END

END CATCH
 
 

