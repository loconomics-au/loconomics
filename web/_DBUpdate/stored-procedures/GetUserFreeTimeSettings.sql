/****** Object:  StoredProcedure [dbo].[GetUserFreeTimeSettings]    Script Date: 07/01/2013 12:06:10 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[GetUserFreeTimeSettings]

@UserID int


as

SELECT
DayofWeek,
MIN(TimeBlock) as StartTime,
DATEADD(MI,15,MAX(TimeBlock)) as EndTime

FROM CalendarProviderFreeEvents
WHERE UserID = @UserID
GROUP BY DayofWeek