/****** Object:  StoredProcedure [dbo].[InsertProviderAvailabilityFreeTime]    Script Date: 07/01/2013 12:05:03 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE proc [dbo].[InsertProviderAvailabilityFreeTime]
  
@ProviderID int,
@DayofWeek tinyint,
@StartTime time,
@EndTime time,
@RemoveDayFreeTime bit = 0

AS BEGIN

--EXEC dbo.InsertProviderAvailabilityFreeTime 60,7,'10:00','14:00'


  IF EXISTS (SELECT * FROM CalendarProviderFreeEvents WHERE UserID = @ProviderID AND DayofWeek= @DayofWeek)

    DELETE FROM CalendarProviderFreeEvents WHERE UserID = @ProviderID AND DayofWeek= @DayofWeek


  -- If is not a deletion execution, continue creating blocks
  IF @RemoveDayFreeTime = 0 BEGIN

	  -- NOT check if starttime is lower than endtime, CHECK IF IS DIFFERENT,
	  -- To allow periods crossing the midnight
	  -- AND use an equivalent DO-WHILE loop, with a first event being created before the first 'while' check,
	  -- to allow 'All Day' events creation

	  CREATEFREEEVENT:
	  BEGIN
	      
		  INSERT INTO CalendarProviderFreeEvents VALUES( @ProviderID,1,@DayofWeek,@StartTime,getdate(),getdate(),'SYS')
	      
		  SET  @StartTime = DATEADD(MI,15,@StartTime)

	  END
	  WHILE @StartTime <> @EndTime GOTO CREATEFREEEVENT
	  
  END

END