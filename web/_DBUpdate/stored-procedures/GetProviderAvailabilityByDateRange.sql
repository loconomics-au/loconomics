/****** Object:  UserDefinedFunction [dbo].[GetProviderAvailabilityByDateRange]    Script Date: 07/01/2013 12:07:19 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		IagoSRL
-- Create date: 2012-09-10
-- Description:	Get the free/busy table of the
-- user based in our four availability states:
-- free, not available, tentative, and busy.
-- This is the order or priority in that the
-- four states/levels are applied to know what
-- has precedence.
-- Original Dave code, changed to be apply 
-- in that layered priority, in a function 
-- instead store procedure, with table vars
-- instead temporary tables -not allowed in
-- functions- and some fixes
-- =============================================
CREATE FUNCTION [dbo].[GetProviderAvailabilityByDateRange]
(
	@UserID int,
	@StartDate date,
	@EndDate date
)
RETURNS
@FullSet TABLE 
(
	DateSet date,
	[DayOfWeek] int,
	TimeBlock time(7),
	DT datetime,
	CalendarAvailabilityTypeID int
)
AS
BEGIN

	-- We need filter results to current and future dates (and time), all past dates must show 'un-available'!!
	-- Time Blocks & Dates MUST BE GREATER THAN THIS DATE (@DT), ELSE WILL BE CONSIDERED UN-AVAILABLE
	DECLARE @DT datetime
	SET @DT = getdate()
	-- SET @D = @LimitDate
	
	-- We need some provider time preferences for extra calculations (time in integer minutes):
	DECLARE @betT int, @advT int
	SELECT	TOP 1
			@betT = ceiling(coalesce(BetweenTime, 0) * 60)
			,@advT = ceiling(coalesce(AdvanceTime, 0) * 60)
	FROM	CalendarProviderAttributes
	WHERE	UserID = @UserID
	SET @betT = coalesce(@betT, 0)
	SET @advT = coalesce(@advT, 0)
	
	-- LIMIT START DATE (@DT) MUST THE PROVIDER 'Time in advance' preference
	SET @DT = dateadd(mi, @advT, @DT)

	DECLARE @TempDates TABLE
	(
	  dId int IDENTITY(1,1),
	  DateSet datetime 
	)
	
	WHILE @StartDate <= @EndDate
	BEGIN
	INSERT INTO @TempDates VALUES (@StartDate)
	SET @StartDate = dateadd(dd, 1, @StartDate)
	END

	/* Insert all possible combinations, by default are 'not available' blocks */

	INSERT INTO @FullSet
	SELECT DateSet, datepart(dw, DateSet), TimeBlock, DateSet + Cast(Timeblock as datetime), 0 as CalendarAvailabilityTypeID
	FROM @TempDates
	CROSS APPLY CalendarTimeBlocks


	/* UPDATE Blocks with explicit user data */
	-- Update with user general 'free' events (generic hour times)
	UPDATE	a
	SET		CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID
	FROM	@FullSet a
	JOIN CalendarProviderFreeEvents b
		on a.[DayOfWeek] = b.DayofWeek
	JOIN CalendarTimeBlocks c
		ON c.TimeBlock = b.TimeBlock
	WHERE
		UserID = @UserID  
		AND a.TimeBlock = b.TimeBlock
		AND a.DT > @DT

	-- Update with date-specific 'free' events (from calendar events)
	/*UPDATE	a
	SET		CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID -- 1 FREE
	FROM	@FullSet a
	JOIN CalendarEvents b
		ON datepart(dy, a.DateSet) = datepart(dy,starttime)
	JOIN CalendarTimeBlocks c
		ON c.TimeBlock >= cast(b.StartTime as time)  
		   and c.TimeBlock < cast(b.EndTime as time)
	WHERE
		UserID = @UserID  
		AND b.CalendarAvailabilityTypeID = 1 -- FREE
		AND a.TimeBlock = c.TimeBlock
		AND a.DT > @DT*/
	UPDATE	a
	SET		CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID -- 1 FREE
	FROM	@FullSet a
	JOIN CalendarEvents b ON 
		b.UserID = @UserID  
		AND b.CalendarAvailabilityTypeID = 1 -- FREE
		AND a.DT > @DT
		AND b.StartTime <= a.DT
		AND dateadd(mi, @betT, b.EndTime) > a.DT
	
	-- Update with date-specific explicit 'not available' events (from calendar events)
	/*UPDATE	a
	SET		CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID -- 0 NOT AVAILABLE
	FROM	@FullSet a
	JOIN CalendarEvents b
		ON datepart(dy, a.DateSet) = datepart(dy,starttime)
	JOIN CalendarTimeBlocks c
		ON c.TimeBlock >= cast(b.StartTime as time)  
		   and c.TimeBlock < cast(b.EndTime as time)
	WHERE
		UserID = @UserID  
		AND b.CalendarAvailabilityTypeID = 0 -- NOT AVAILABLE
		AND a.TimeBlock = c.TimeBlock
		AND a.DT > @DT*/
	UPDATE	a
	SET		CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID -- 0 NOT AVAILABLE
	FROM	@FullSet a
	JOIN CalendarEvents b ON 
		b.UserID = @UserID  
		AND b.CalendarAvailabilityTypeID = 0 -- NOT AVAILABLE
		AND a.DT > @DT
		AND b.StartTime <= a.DT
		AND dateadd(mi, @betT, b.EndTime) > a.DT
	
	-- Update with 'tentative' events (from calendar events)
	/*UPDATE	a
	SET		CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID -- 3 TENTATIVE
	FROM	@FullSet a
	JOIN CalendarEvents b
		ON datepart(dy, a.DateSet) = datepart(dy,starttime)
	JOIN CalendarTimeBlocks c
		ON c.TimeBlock >= cast(b.StartTime as time)  
		   and c.TimeBlock < cast(b.EndTime as time)
	WHERE
		UserID = @UserID  
		AND b.CalendarAvailabilityTypeID = 3 -- TENTATIVE
		AND a.TimeBlock = c.TimeBlock
		AND a.DT > @DT*/
	UPDATE	a
	SET		CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID -- 3 TENTATIVE
	FROM	@FullSet a
	JOIN CalendarEvents b ON 
		b.UserID = @UserID  
		AND b.CalendarAvailabilityTypeID = 3 -- TENTATIVE
		AND a.DT > @DT
		AND b.StartTime <= a.DT
		AND dateadd(mi, @betT, b.EndTime) > a.DT

	-- Update with 'busy' events (from calendar events)
	/*UPDATE	a
	SET		CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID -- 2 BUSY
	FROM	@FullSet a
	JOIN CalendarEvents b
		ON datepart(dy, a.DateSet) = datepart(dy,starttime)
	JOIN CalendarTimeBlocks c
		ON c.TimeBlock >= cast(b.StartTime as time)  
		   and c.TimeBlock < cast(dateadd(mi, @betT, b.EndTime) as time)
	WHERE
		UserID = @UserID  
		AND b.CalendarAvailabilityTypeID = 2 -- BUSY
		AND a.TimeBlock = c.TimeBlock
		AND a.DT > @DT*/
	UPDATE	a
	SET		CalendarAvailabilityTypeID = b.CalendarAvailabilityTypeID -- 2 BUSY
	FROM	@FullSet a
	JOIN CalendarEvents b ON 
		b.UserID = @UserID  
		AND b.CalendarAvailabilityTypeID = 2 -- BUSY
		AND a.DT > @DT
		AND b.StartTime <= a.DT
		AND dateadd(mi, @betT, b.EndTime) > a.DT

	RETURN 
END
