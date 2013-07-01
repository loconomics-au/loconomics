/****** Object:  UserDefinedFunction [dbo].[ParseDayOfWeekBitmask]    Script Date: 07/01/2013 12:06:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE FUNCTION [dbo].[ParseDayOfWeekBitmask]
(
   @Bitmask CHAR(7)
)
RETURNS @Result TABLE
(
   Monday bit, Tuesday bit, Wednesday bit, Thursday bit, Friday bit,
   Saturday bit, Sunday bit
)
AS
BEGIN
   -- Validate bitmask
   IF @Bitmask IS NULL
       -- Must be 7 characters long
       OR LEN(@Bitmask) < 7
       -- Should only contain zeros and ones
       OR LEN(REPLACE(REPLACE(@Bitmask, '0', ''), '1', '')) > 0
       BEGIN  
           INSERT INTO @Result
               SELECT 0, 0, 0, 0, 0, 0, 0;    
           RETURN
       END

   -- Perform an OR operation on each digit 
   INSERT INTO @Result
       SELECT
           Monday = (SUBSTRING(@Bitmask, 1, 1) | 0),
           Tuesday = (SUBSTRING(@Bitmask, 2, 1) | 0),
           Wednesday = (SUBSTRING(@Bitmask, 3, 1) | 0),
           Thursday = (SUBSTRING(@Bitmask, 4, 1) | 0),
           Friday = (SUBSTRING(@Bitmask, 5, 1) | 0),
           Saturday = (SUBSTRING(@Bitmask, 6, 1) | 0),
           Sunday = (SUBSTRING(@Bitmask, 7, 1) | 0)  

   RETURN
END