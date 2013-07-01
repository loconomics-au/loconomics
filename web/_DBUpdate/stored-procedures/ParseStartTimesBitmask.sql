/****** Object:  UserDefinedFunction [dbo].[ParseStartTimesBitmask]    Script Date: 07/01/2013 12:06:54 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE FUNCTION [dbo].[ParseStartTimesBitmask]
(
   @Bitmask CHAR(24)
)


--011000100000000000000000  

RETURNS @Result TABLE
(
  Twelve bit ,TwelveThirty bit, One bit, OneThirty bit, Two bit , TwoThirty bit , Three bit, ThreeThirty bit, Four bit, FourThirty bit, Five bit, FiveThirty bit, Six bit, SixThirty bit, 
  Seven bit, SevenThirty bit , Eight bit, EightThirty bit, Nine bit, NineThirty bit, Ten bit, TenThirty bit, Eleven bit, ElevenThirty bit   
)
AS
BEGIN
   -- Validate bitmask
   IF @Bitmask IS NULL
       -- Must be 24 characters long
       OR LEN(@Bitmask) < 24
       -- Should only contain zeros and ones
       OR LEN(REPLACE(REPLACE(@Bitmask, '0', ''), '1', '')) > 0
       BEGIN  
           INSERT INTO @Result
               SELECT 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0;    
           RETURN
       END

   -- Perform an OR operation on each digit 
   INSERT INTO @Result
       SELECT
           Twelve =				(SUBSTRING(@Bitmask, 1, 1) | 0),
           TwelveThirty =		(SUBSTRING(@Bitmask, 2, 1) | 0),
           One =				(SUBSTRING(@Bitmask, 3, 1) | 0),
           OneThirty =			(SUBSTRING(@Bitmask, 4, 1) | 0),
           Two =				(SUBSTRING(@Bitmask, 5, 1) | 0),
           TwoThirty =			(SUBSTRING(@Bitmask, 6, 1) | 0),
           Three =				(SUBSTRING(@Bitmask, 7, 1) | 0),  
           ThreeThirty =		(SUBSTRING(@Bitmask, 8, 1) | 0),
           Four =				(SUBSTRING(@Bitmask, 9, 1) | 0),
           FourThirty =			(SUBSTRING(@Bitmask, 10, 1) | 0),
           Five =				(SUBSTRING(@Bitmask, 11, 1) | 0),
           FiveThirty =			(SUBSTRING(@Bitmask, 12, 1) | 0),
           Six =				(SUBSTRING(@Bitmask, 13, 1) | 0),
           SixThirty =			(SUBSTRING(@Bitmask, 14, 1) | 0),  
           Seven =				(SUBSTRING(@Bitmask, 15, 1) | 0),
           SevenThirty =		(SUBSTRING(@Bitmask, 16, 1) | 0),
           Eight =				(SUBSTRING(@Bitmask, 17, 1) | 0),
           EightThirty =		(SUBSTRING(@Bitmask, 18, 1) | 0),
           Nine =				(SUBSTRING(@Bitmask, 19, 1) | 0),
           NineThirty =			(SUBSTRING(@Bitmask, 20, 1) | 0),
           Ten =				(SUBSTRING(@Bitmask, 21, 1) | 0),  
           TenThirty =			(SUBSTRING(@Bitmask, 22, 1) | 0),
           Eleven =				(SUBSTRING(@Bitmask, 23, 1) | 0),
           ElevenThirty =		(SUBSTRING(@Bitmask, 24, 1) | 0)
              
           

   RETURN
END