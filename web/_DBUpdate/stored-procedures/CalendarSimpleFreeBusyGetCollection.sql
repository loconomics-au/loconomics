/****** Object:  StoredProcedure [dbo].[CalendarSimpleFreeBusyGetCollection]    Script Date: 07/01/2013 12:02:56 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[CalendarSimpleFreeBusyGetCollection]
	-- Add the parameters for the stored procedure here
	 @vUserId BIGINT
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	-- combination of EventLocation and CalendarEvent data
	SELECT   e.Id 
			,e.UserId 
			,e.IcsSrcName
			,e.UID
			,e.TimeZone
			,e.EndTime
			,e.RecurringRules
			,e.StartTime
			,e.CalendarEventLocationId
			,l.CrossStreets
			,l.Lattitude
			,l.Longitude
	FROM	CalendarEvents e
	JOIN	CalendarEventLocations l
	  ON	e.CalendarEventLocationId = l.CalendarEventLocationId
	 AND	e.UserId = l.UserId
	WHERE   e.UserId = @vUserId 
	    


    -- Insert statements for procedure here

END





