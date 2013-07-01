/****** Object:  StoredProcedure [dbo].[CheckProviderAvailability]    Script Date: 07/01/2013 12:05:22 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[CheckProviderAvailability] 


@ProviderUserID INT, @StartDateTime datetime, @EndDateTime datetime


as
--exec  dbo.CheckProviderAvailability 34, '20120731 11:30:00', '20120731 13:00:00'

/* IagoSRL: As part of the changes on GetProviderAvailabilityFullSet and the new function,
	this procedure was changed to be more accuracy, understanding the layered availability
	calculation.
	Original Dave's code is at end under comments
*/

IF EXISTS (
SELECT	*
FROM	dbo.GetProviderAvailabilityByDateRange( @ProviderUserID, Cast(@StartDateTime As date), Cast(@EndDateTime As date) ) As A
WHERE	
		CalendarAvailabilityTypeID IN (0, 2) AND -- Is not available or busy event.
		(   (DateSet + cast(TimeBlock as datetime)) >= @StartDateTime
		AND (DateSet + cast(TimeBlock as datetime)) < @EndDateTime 
		)
)
	SELECT Cast( 1 as bit ) -- provider is not available
ELSE
	SELECT Cast( 0 as bit ) -- provider is available

/*
DECLARE @Busy int

SELECT @Busy = Count(*) 
FROM dbo.CalendarEvents b
WHERE  StartTime BETWEEN @StartDateTime AND @EndDateTime
OR EndTime BETWEEN @StartDateTime AND @EndDateTime
AND CalendarAvailabilityTypeID  IN (2, 4)
AND b.UserID  = @ProviderUserID

SELECT CASE WHEN @Busy > 0 THEN 1 ELSE 0 END
*/