/****** Object:  StoredProcedure [dbo].[CalendarSimpleFreeBusyDelete]    Script Date: 07/01/2013 12:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[CalendarSimpleFreeBusyDelete]
	 @vCalendarEventId BIGINT
	,@vUserId BIGINT
	,@vCalendarEventLocationId BIGINT = NULL
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	-- combination of EventLocation and CalendarEvent data
	BEGIN TRANSACTION
	
	-- if CalendarEventLocationId is not provided we need to get it first
	IF @vCalendarEventLocationId = NULL
		BEGIN
			SET @vCalendarEventLocationId = (SELECT CalendarEventLocationId
											FROM   [dbo].[CalendarEvents]
											WHERE  UserId = @vUserId )
		
			IF @@ERROR <> 0
			BEGIN 
				ROLLBACK TRANSACTION
				RAISERROR('[procedure-CalendarSimpleFreeBusyDelete] Error occurred while attempting to retrieve CalendarEventLocationId, Rolling back.', 16,1)
				RETURN
			END
		
		END
	
		DELETE	
		FROM	[dbo].[CalendarEvents]
		WHERE	[dbo].[CalendarEvents].[Id] = @vCalendarEventId
		  AND	[dbo].[CalendarEvents].[UserId] = @vUserId
				
		IF @@ERROR <> 0
			BEGIN 
				ROLLBACK TRANSACTION
				RAISERROR('[procedure-CalendarSimpleFreeBusyDelete] Error occurred while deleting CalendarEvents, Rolling back.', 16,1)
				RETURN
			END
		
		DELETE	
		FROM	[dbo].[CalendarEventLocations] 
		WHERE	[dbo].[CalendarEventLocations].[CalendarEventLocationId] = @vCalendarEventLocationId
		  AND	[dbo].[CalendarEventLocations].[UserId] = @vUserId
			
		IF @@ERROR <> 0
			BEGIN 
				ROLLBACK TRANSACTION
				RAISERROR('[procedure-CalendarSimpleFreeBusyDelete] Error occurred while deleting CalendarEventLocations, Rolling back.', 16,1)
				RETURN
			END	
	
	COMMIT TRANSACTION
    
END





