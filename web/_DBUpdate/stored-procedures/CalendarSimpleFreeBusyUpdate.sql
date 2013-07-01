/****** Object:  StoredProcedure [dbo].[CalendarSimpleFreeBusyUpdate]    Script Date: 07/01/2013 12:03:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[CalendarSimpleFreeBusyUpdate]
	 @vCalendarEventId BIGINT
	,@vUserId BIGINT
	,@vStartTime DATETIME
	,@vIcsSrcName NVARCHAR(100)
	,@vUID NVARCHAR(100)
	,@vTimeZone NVARCHAR(100)
	,@vEndTime DATETIME
	,@vRecurringRules NVARCHAR(500)
	,@vCalendarEventLocationId BIGINT
	,@vLongitude NVARCHAR(10)
	,@vLattitude NVARCHAR(10)
	,@vCrossStreets NVARCHAR(250)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	-- combination of EventLocation and CalendarEvent data
	BEGIN TRANSACTION
		UPDATE   [dbo].[CalendarEvents]
		SET		 [dbo].[CalendarEvents].[StartTime] = @vStartTime
				,[dbo].[CalendarEvents].[IcsSrcName] = @vIcsSrcName
				,[dbo].[CalendarEvents].[UID] = @vUID
				,[dbo].[CalendarEvents].[TimeZone] = @vTimeZone
				,[dbo].[CalendarEvents].[EndTime] = @vEndTime
				,[dbo].[CalendarEvents].[RecurringRules] = @vRecurringRules
		WHERE	 [dbo].[CalendarEvents].[Id] = @vCalendarEventId
		  AND	 [dbo].[CalendarEvents].[UserId] = @vUserId
		
		
		IF @@ERROR <> 0
			BEGIN 
				ROLLBACK TRANSACTION
				RAISERROR('[procedure-CalendarSimpleFreeBusyUpdate] Error occurred while updating CalendarEvents, Rolling back.', 16,1)
				RETURN
			END
			
		UPDATE	 [dbo].[CalendarEventLocations] 
		SET		 [dbo].[CalendarEventLocations].[CrossStreets] = @vCrossStreets
				,[dbo].[CalendarEventLocations].[Lattitude] = @vLattitude
				,[dbo].[CalendarEventLocations].[Longitude] = @vLongitude
		WHERE	 [dbo].[CalendarEventLocations].[CalendarEventLocationId] = @vCalendarEventLocationId
		  AND	 [dbo].[CalendarEventLocations].[UserId] = @vUserId
		
	
		IF @@ERROR <> 0
			BEGIN 
				ROLLBACK TRANSACTION
				RAISERROR('[procedure-CalendarSimpleFreeBusyUpdate] Error occurred while updating CalendarEventLocations, Rolling back.', 16,1)
				RETURN
			END	
	
	COMMIT TRANSACTION

    EXEC CalendarSimpleFreeBusyGet @vCalendarEventId, @vUserId


END




