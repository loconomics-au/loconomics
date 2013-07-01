/****** Object:  StoredProcedure [dbo].[GetProviderAvailabilityFullSet]    Script Date: 07/01/2013 12:05:52 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[GetProviderAvailabilityFullSet]


@ProviderID int,
@AvailStartDate smalldatetime,
@AvailEndDate smalldatetime = null

as
--exec  dbo.GetProviderAvailabilityFullSet 60,'2012-05-03'

/*
 * New version, IagoSRL, based
 * on original Dave code now we
 * have a table-function that 
 * creates the 'availability full set'
 * called GetProviderAvailabilityByDateRange
 *
 * We use it to return 1 week from the requested date by default
 * or between given dates if @AvailEndDate is not null
 * (this new has not the CalendarAvailabilityTypeName field, unused)
 */

If @AvailEndDate is null 
	SET @AvailEndDate  = dateadd(dd, 6, @AvailStartDate)

SELECT	A.*
FROM	dbo.GetProviderAvailabilityByDateRange( @ProviderID, @AvailStartDate, @AvailEndDate ) As A
ORDER BY DateSet, TimeBlock


/****************************
 * Previous version, original
 * Dave code
 ****************************/
/*
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


--insert all possible combinations

SELECT DateSet,datepart(dw,dateset) as DayofWeek, TimeBlockID, TimeBlock, 0 as CalendarAvailabilityTypeID, 'Not Available' as CalendarAvailabilityTypeName   
INTO #FullSet
FROM #TempDates 
CROSS APPLY CalendarTimeBlocks

--update calendar events

UPDATE a
SET CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID ,
CalendarAvailabilityTypeName = d.CalendarAvailabilityTypeName
FROM #FullSet a
JOIN  dbo.CalendarEvents b
    on datepart(dy,a.DateSet) = datepart(dy,starttime)
JOIN CalendarTimeBlocks c
    ON c.TimeBlock >= cast(b.StartTime as time)  
       and c.TimeBlock < cast(b.EndTime as time)
JOIN dbo.CalendarAvailabilityType d
    ON b.CalendarAvailabilityTypeID = d.CalendarAvailabilityTypeID
WHERE USERID  = @ProviderID 
and a.Timeblock = c.TimeBlock
AND a.CalendarAvailabilityTypeID = 0

--update calendar free time

UPDATE a
SET CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID ,
CalendarAvailabilityTypeName = d.CalendarAvailabilityTypeName
FROM #FullSet a
JOIN  dbo.CalendarProviderFreeEvents b
    on datepart(dw,a.DateSet) = b.DayofWeek
JOIN CalendarTimeBlocks c
    ON c.TimeBlock = b.TimeBlock
JOIN dbo.CalendarAvailabilityType d
    ON b.CalendarAvailabilityTypeID = d.CalendarAvailabilityTypeID
WHERE USERID  = @ProviderID  
and a.TimeBlock = b.TimeBlock
AND a.CalendarAvailabilityTypeID = 0


-- return full set

SELECT * FROM  #FullSet
ORDER BY DATESET,timeblock
*/