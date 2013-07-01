/****** Object:  StoredProcedure [dbo].[GetProviderAvailability_OLD]    Script Date: 07/01/2013 12:05:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[GetProviderAvailability_OLD]


@ProviderID int,
@AvailStartDate smalldatetime

as
--exec  dbo.GetProviderAvailability 60,'2012-05-02'


CREATE TABLE #TempDates
(
  dId int IDENTITY(1,1),
  DateSet datetime 
)

DECLARE @StartDate datetime,@EndDate datetime

SET @StartDate = @AvailStartDate
SET @EndDate  = dateadd(dd,6,@StartDate)

WHILE @StartDate <= @EndDate
BEGIN
INSERT INTO #TempDates VALUES (dateadd(dd,1,@StartDate))
SET @StartDate = dateadd(dd,1,@StartDate)
END


SELECT 
DISTINCT
b.UserId,
b.CalendarAvailabilityTypeID,
c.CalendarAvailabilityTypeName,
datepart(dw,b.StartTime) as DayOfWeek,
b.StartTime,
b.EndTime,
d.TimeBlock
FROM #TempDates a
LEFT JOIN  dbo.CalendarEvents b
    on a.DateSet = convert(smalldatetime,cast(b.StartTime as varchar(12)))
LEFT JOIN dbo.CalendarAvailabilityType c
    on b.CalendarAvailabilityTypeID = c.CalendarAvailabilityTypeID
CROSS APPLY CalendarTimeBlocks d
WHERE d.TimeBlock between cast(b.StartTime as time) and cast(b.EndTime as time)
AND b.UserID  = @ProviderID