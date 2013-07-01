/****** Object:  StoredProcedure [dbo].[CalendarSimpleFreeBusyCreate]    Script Date: 07/01/2013 12:01:28 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[CalendarSimpleFreeBusyCreate]
	 @vUserId BIGINT	
	,@vStartTime DATETIME
	,@vIcsSrcName VARCHAR(150)
	,@vUID VARCHAR(150)
	,@vTimeZone VARCHAR(150)
	,@vEndTime DATETIME
	,@vRecurringRules VARCHAR(500)
	,@vLongitude VARCHAR(150)
	,@vLattitude VARCHAR(150)
	,@vCrossStreets VARCHAR(150)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	-- combination of EventLocation and CalendarEvent data
	
	INSERT INTO	 [dbo].[CalendarEventLocations] 
	(
		 CrossStreets
		,Lattitude
		,Longitude
		,UserId
	)
	VALUES
	(
		 @vCrossStreets
		,@vLattitude
		,@vLongitude
		,@vUserId
	)
	
	DECLARE @CalendarEventLocationId as BIGINT
	SET @CalendarEventLocationId = @@IDENTITY
	
	
	IF @@ERROR <> 0
		BEGIN 
			RAISERROR('[procedure-CalendarSimpleFreeBusyCreate] Error occurred while inserting into CalendarEventLocations.', 16,1)
			RETURN
		END	
     -- =========================================================================
	
	INSERT INTO  [dbo].[CalendarEvents]
	(
		 StartTime
		,IcsSrcName
		,[UID]
		,TimeZone
		,EndTime
		,RecurringRules
		,CalendarEventLocationId
		,UserId		
	)
	VALUES
	(
		 @vStartTime
		,@vIcsSrcName
		,@vUID
		,@vTimeZone
		,@vEndTime
		,@vRecurringRules
		,@CalendarEventLocationId
		,@vUserId
	)
	
	
	DECLARE @CalendarEventId as BIGINT
	SELECT @CalendarEventId = @@IDENTITY
		
	IF @@ERROR <> 0
		BEGIN 
			RAISERROR('[procedure-CalendarSimpleFreeBusyCreate] Error occurred while inserting into CalendarEvents.', 16,1)
			RETURN
		END
     -- =========================================================================
		
	EXECUTE [dbo].[CalendarSimpleFreeBusyGet] @CalendarEventId, @vUserId 
	
END





